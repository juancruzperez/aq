import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders } from "../../db/schema";

export type CostsPeriod = {
  from?: Date;
  to?: Date;
};

export async function getCosts({
  from,
  to,
}: CostsPeriod = {}): Promise<number> {
  const conditions = [eq(orders.status, "COMPLETED")];

  if (from) {
    conditions.push(sql`${orders.completedAt} >= ${from}`);
  }

  if (to) {
    conditions.push(sql`${orders.completedAt} < ${to}`);
  }

  const [result] = await db
    .select({
      costs: sql<string>`
        COALESCE(
          SUM(${orderItems.costo} * ${orderItems.quantity}),
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

  return Number(result.costs);
}