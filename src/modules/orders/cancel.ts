import { eq } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders } from "../../db/schema";
import { releaseStock } from "../inventory/release";

export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`La orden ${orderId} no existe.`);
    this.name = "OrderNotFoundError";
  }
}

export class OrderNotPendingError extends Error {
  constructor(orderId: string, status: string) {
    super(
      `La orden ${orderId} no puede cancelarse porque su estado actual es ${status}.`,
    );
    this.name = "OrderNotPendingError";
  }
}

export async function cancelOrder(orderId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: orders.id,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    if (order.status !== "PENDING") {
      throw new OrderNotPendingError(orderId, order.status);
    }

    const items = await tx
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      await releaseStock(tx, {
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    const [cancelledOrder] = await tx
      .update(orders)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      });

    return {
      order: cancelledOrder,
      items,
    };
  });
}