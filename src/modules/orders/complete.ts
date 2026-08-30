import { eq } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders } from "../../db/schema";
import { completeStock } from "../inventory/complete";

export class OrderNotFoundForCompleteError extends Error {
  constructor(orderId: string) {
    super(`La orden ${orderId} no existe.`);
    this.name = "OrderNotFoundForCompleteError";
  }
}

export class OrderNotReadyForCompleteError extends Error {
  constructor(orderId: string, status: string) {
    super(
      `La orden ${orderId} no puede completarse porque su estado actual es ${status}.`,
    );
    this.name = "OrderNotReadyForCompleteError";
  }
}

export async function completeOrder(orderId: string) {
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
      throw new OrderNotFoundForCompleteError(orderId);
    }

    if (order.status !== "READY_FOR_DELIVERY") {
      throw new OrderNotReadyForCompleteError(
        orderId,
        order.status,
      );
    }

    const items = await tx
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (items.length === 0) {
      throw new Error(
        `La orden ${orderId} no contiene productos.`,
      );
    }

    for (const item of items) {
      await completeStock(tx, {
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    const completedAt = new Date();

    const [completedOrder] = await tx
      .update(orders)
      .set({
        status: "COMPLETED",
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        completedAt: orders.completedAt,
      });

    return {
      order: completedOrder,
      items,
    };
  });
}
