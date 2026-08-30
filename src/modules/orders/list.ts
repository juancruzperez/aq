import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { orders } from "../../db/schema";

export type ListOrdersInput = {
  userId?: string;
  status?: "PENDING" | "READY_FOR_DELIVERY" | "COMPLETED" | "CANCELLED";
  limit?: number;
  offset?: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listOrders({
  userId,
  status,
  limit = DEFAULT_LIMIT,
  offset = 0,
}: ListOrdersInput = {}) {
  const normalizedLimit = Math.min(
    Math.max(Math.trunc(limit), 1),
    MAX_LIMIT,
  );

  const normalizedOffset = Math.max(Math.trunc(offset), 0);

  const conditions = [];

  if (userId) {
    conditions.push(eq(orders.userId, userId));
  }

  if (status) {
    conditions.push(eq(orders.status, status));
  }

  return db
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(normalizedLimit)
    .offset(normalizedOffset);
}