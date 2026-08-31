import { asc } from "drizzle-orm";

import { db } from "../../db";
import { products } from "../../db/schema";

export async function listProducts() {
  return db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      precioVenta: products.precioVenta,
      costo: products.costo,
      stockReal: products.stockReal,
      stockComprometido: products.stockComprometido,
      stockMinimo: products.stockMinimo,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .orderBy(asc(products.name));
}
