import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders } from "../../db/schema";

export type RevenuePeriod = {
  from?: Date;
  to?: Date;
};

export async function getRevenue({
  from,
  to,
}: RevenuePeriod = {}): Promise<number> {
  const conditions = [eq(orders.status, "COMPLETED")];

  if (from) {
    conditions.push(sql`${orders.completedAt} >= ${from}`);
  }

  if (to) {
    conditions.push(sql`${orders.completedAt} < ${to}`);
  }

  const [result] = await db
    .select({
      revenue: sql<string>`
        COALESCE(
          SUM(${orderItems.price} * ${orderItems.quantity}),
          0
        )::text
      `,
    })
    .from(orders)
    .innerJoin(
      orderItems,
      eq(orderItems.orderId, orders.id),
    )
    .where(and(...conditions));

  return Number(result.revenue);
}