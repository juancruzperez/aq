import { eq } from "drizzle-orm";

import { db } from "../../db";
import { orders } from "../../db/schema";

export class OrderNotFoundForReadyError extends Error {
  constructor(orderId: string) {
    super(`La orden ${orderId} no existe.`);
    this.name = "OrderNotFoundForReadyError";
  }
}

export class OrderNotPendingForReadyError extends Error {
  constructor(orderId: string, status: string) {
    super(
      `La orden ${orderId} no puede pasar a READY_FOR_DELIVERY porque su estado actual es ${status}.`,
    );
    this.name = "OrderNotPendingForReadyError";
  }
}

export async function markOrderReady(orderId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new OrderNotFoundForReadyError(orderId);
    }

    if (order.status !== "PENDING") {
      throw new OrderNotPendingForReadyError(orderId, order.status);
    }

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        status: "READY_FOR_DELIVERY",
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

    return updatedOrder;
  });
}