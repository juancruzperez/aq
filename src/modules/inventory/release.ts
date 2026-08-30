import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { products } from "../../db/schema";

type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type ReleaseStockInput = {
  productId: string;
  quantity: number;
};

export type ReleasedStock = {
  productId: string;
  quantity: number;
  stockReal: number;
  stockComprometido: number;
  stockDisponible: number;
};

export class InvalidReleaseQuantityError extends Error {
  constructor() {
    super("La cantidad a liberar debe ser un entero mayor que cero.");
    this.name = "InvalidReleaseQuantityError";
  }
}

export class ReleaseProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`El producto ${productId} no existe.`);
    this.name = "ReleaseProductNotFoundError";
  }
}

export class InvalidStockReleaseError extends Error {
  constructor(productId: string, quantity: number) {
    super(
      `No se pueden liberar ${quantity} unidad(es) del producto ${productId}: el stock comprometido es insuficiente.`,
    );
    this.name = "InvalidStockReleaseError";
  }
}

export async function releaseStock(
  tx: DatabaseTransaction,
  { productId, quantity }: ReleaseStockInput,
): Promise<ReleasedStock> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidReleaseQuantityError();
  }

  const result = await tx
    .update(products)
    .set({
      stockComprometido: sql`${products.stockComprometido} - ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      sql`
        ${eq(products.id, productId)}
        AND ${products.stockComprometido} >= ${quantity}
      `,
    )
    .returning({
      id: products.id,
      stockReal: products.stockReal,
      stockComprometido: products.stockComprometido,
    });

  if (result.length === 0) {
    const product = await tx
      .select({
        id: products.id,
      })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      throw new ReleaseProductNotFoundError(productId);
    }

    throw new InvalidStockReleaseError(productId, quantity);
  }

  const product = result[0];

  return {
    productId: product.id,
    quantity,
    stockReal: product.stockReal,
    stockComprometido: product.stockComprometido,
    stockDisponible: product.stockReal - product.stockComprometido,
  };
}