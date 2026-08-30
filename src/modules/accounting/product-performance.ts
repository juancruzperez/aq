import { and, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { orderItems, orders, products } from "../../db/schema";

export type ProductPerformancePeriod = {
  from?: Date;
  to?: Date;
};

export type ProductPerformance = {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  costs: number;
  grossProfit: number;
  grossMargin: number;
  stockReal: number;
  stockComprometido: number;
  stockDisponible: number;
  stockMinimo: number;
};

export async function getProductPerformance({
  from,
  to,
}: ProductPerformancePeriod = {}): Promise<ProductPerformance[]> {
  const conditions = [eq(orders.status, "COMPLETED")];

  if (from) {
    conditions.push(sql`${orders.completedAt} >= ${from}`);
  }

  if (to) {
    conditions.push(sql`${orders.completedAt} < ${to}`);
  }

  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,

      unitsSold: sql<number>`
        SUM(${orderItems.quantity})
      `,

      revenue: sql<string>`
        SUM(${orderItems.price} * ${orderItems.quantity})::text
      `,

      costs: sql<string>`
        SUM(${orderItems.costo} * ${orderItems.quantity})::text
      `,

      stockReal: products.stockReal,
      stockComprometido: products.stockComprometido,
      stockMinimo: products.stockMinimo,
    })
    .from(orderItems)
    .innerJoin(
      orders,
      eq(orderItems.orderId, orders.id),
    )
    .innerJoin(
      products,
      eq(orderItems.productId, products.id),
    )
    .where(and(...conditions))
    .groupBy(
      products.id,
      products.name,
      products.stockReal,
      products.stockComprometido,
      products.stockMinimo,
    )
    .orderBy(
      sql`SUM(${orderItems.price} * ${orderItems.quantity}) DESC`,
    );

  return rows.map((row) => {
    const revenue = Number(row.revenue);
    const costs = Number(row.costs);
    const grossProfit = revenue - costs;

    return {
      productId: row.productId,
      productName: row.productName,
      unitsSold: Number(row.unitsSold),
      revenue,
      costs,
      grossProfit,
      grossMargin:
        revenue > 0
          ? (grossProfit / revenue) * 100
          : 0,
      stockReal: row.stockReal,
      stockComprometido: row.stockComprometido,
      stockDisponible:
        row.stockReal - row.stockComprometido,
      stockMinimo: row.stockMinimo,
    };
  });
}