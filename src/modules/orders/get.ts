import { eq } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders, products } from "../../db/schema";

export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`La orden ${orderId} no existe.`);
    this.name = "OrderNotFoundError";
  }
}

export async function getOrder(orderId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      completedAt: orders.completedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new OrderNotFoundError(orderId);
  }

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      productName: products.name,
      quantity: orderItems.quantity,
      price: orderItems.price,
      costo: orderItems.costo,
      subtotal: orderItems.price,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    order,
    items: items.map((item) => ({
      ...item,
      subtotal: item.price * item.quantity,
    })),
  };
}