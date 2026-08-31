import { eq } from "drizzle-orm";

import { db } from "../../db";
import { products } from "../../db/schema";

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`El producto ${productId} no existe.`);
    this.name = "ProductNotFoundError";
  }
}

export async function getProduct(productId: string) {
  const [product] = await db
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
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw new ProductNotFoundError(productId);
  }

  return product;
}