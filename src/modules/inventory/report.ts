import { asc } from "drizzle-orm";

import { db } from "../../db";
import { products } from "../../db/schema";

export type InventoryStatus =
  | "NORMAL"
  | "CRITICAL"
  | "OUT_OF_STOCK";

export type InventoryReportItem = {
  productId: string;
  productName: string;
  stockReal: number;
  stockComprometido: number;
  stockDisponible: number;
  stockMinimo: number;
  status: InventoryStatus;
};

export async function getInventoryReport(): Promise<
  InventoryReportItem[]
> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      stockReal: products.stockReal,
      stockComprometido: products.stockComprometido,
      stockMinimo: products.stockMinimo,
    })
    .from(products)
    .orderBy(asc(products.name));

  return rows.map((product) => {
    const stockDisponible =
      product.stockReal - product.stockComprometido;

    let status: InventoryStatus;

    if (stockDisponible === 0) {
      status = "OUT_OF_STOCK";
    } else if (stockDisponible <= product.stockMinimo) {
      status = "CRITICAL";
    } else {
      status = "NORMAL";
    }

    return {
      productId: product.productId,
      productName: product.productName,
      stockReal: product.stockReal,
      stockComprometido: product.stockComprometido,
      stockDisponible,
      stockMinimo: product.stockMinimo,
      status,
    };
  });
}