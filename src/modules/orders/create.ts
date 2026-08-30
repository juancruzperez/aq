import { inArray } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders, products } from "../../db/schema";
import { checkCriticalStock } from "../inventory/critical-alert";
import { reserveStock } from "../inventory/reserve";

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  userId: string;
  items: CreateOrderItemInput[];
};

export class EmptyOrderError extends Error {
  constructor() {
    super("El pedido debe contener al menos un producto.");
    this.name = "EmptyOrderError";
  }
}

export class DuplicateProductError extends Error {
  constructor(productId: string) {
    super(`El producto ${productId} aparece más de una vez en el pedido.`);
    this.name = "DuplicateProductError";
  }
}

export class InvalidOrderQuantityError extends Error {
  constructor(productId: string) {
    super(
      `La cantidad solicitada para el producto ${productId} debe ser un entero mayor que cero.`,
    );
    this.name = "InvalidOrderQuantityError";
  }
}

export class OrderProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`El producto ${productId} no existe.`);
    this.name = "OrderProductNotFoundError";
  }
}

export async function createOrder({
  userId,
  items,
}: CreateOrderInput) {
  if (items.length === 0) {
    throw new EmptyOrderError();
  }

  const productIds = items.map((item) => item.productId);
  const uniqueProductIds = new Set(productIds);

  if (uniqueProductIds.size !== productIds.length) {
    const duplicatedProductId = productIds.find(
      (id, index) => productIds.indexOf(id) !== index,
    );

    throw new DuplicateProductError(duplicatedProductId!);
  }

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new InvalidOrderQuantityError(item.productId);
    }
  }

  return db.transaction(async (tx) => {
    const productRows = await tx
      .select({
        id: products.id,
        precioVenta: products.precioVenta,
        costo: products.costo,
      })
      .from(products)
      .where(inArray(products.id, productIds));

    if (productRows.length !== productIds.length) {
      const existingIds = new Set(productRows.map((product) => product.id));

      const missingProductId = productIds.find(
        (productId) => !existingIds.has(productId),
      );

      throw new OrderProductNotFoundError(missingProductId!);
    }

    const productMap = new Map(
      productRows.map((product) => [product.id, product]),
    );

    const totalAmount = items.reduce((total, item) => {
      const product = productMap.get(item.productId)!;

      return total + product.precioVenta * item.quantity;
    }, 0);

    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        status: "PENDING",
        totalAmount,
      })
      .returning({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      });

    const createdItems = [];

    for (const item of items) {
      const reservation = await reserveStock(tx, item);

      const product = productMap.get(item.productId)!;

      const [orderItem] = await tx
        .insert(orderItems)
        .values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.precioVenta,
          costo: product.costo,
        })
        .returning({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          costo: orderItems.costo,
        });

      createdItems.push(orderItem);

      await checkCriticalStock(tx, {
        productId: item.productId,
      });

      // reservation is intentionally not returned as part of the
      // persisted order item; it represents the inventory operation.
      void reservation;
    }

    return {
      order,
      items: createdItems,
    };
  });
}