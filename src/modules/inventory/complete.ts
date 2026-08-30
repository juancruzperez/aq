import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { products } from "../../db/schema";

type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type CompleteStockInput = {
  productId: string;
  quantity: number;
};

export type CompletedStock = {
  productId: string;
  quantity: number;
  stockReal: number;
  stockComprometido: number;
  stockDisponible: number;
};

export class InvalidCompletionQuantityError extends Error {
  constructor() {
    super("La cantidad a completar debe ser un entero mayor que cero.");
    this.name = "InvalidCompletionQuantityError";
  }
}

export class CompletionProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`El producto ${productId} no existe.`);
    this.name = "CompletionProductNotFoundError";
  }
}

export class InvalidStockCompletionError extends Error {
  constructor(productId: string, quantity: number) {
    super(
      `No se pueden completar ${quantity} unidad(es) del producto ${productId}: el stock comprometido o el stock real es insuficiente.`,
    );
    this.name = "InvalidStockCompletionError";
  }
}

export async function completeStock(
  tx: DatabaseTransaction,
  { productId, quantity }: CompleteStockInput,
): Promise<CompletedStock> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidCompletionQuantityError();
  }

  const result = await tx
    .update(products)
    .set({
      stockReal: sql`${products.stockReal} - ${quantity}`,
      stockComprometido: sql`${products.stockComprometido} - ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      sql`
        ${eq(products.id, productId)}
        AND ${products.stockReal} >= ${quantity}
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
      throw new CompletionProductNotFoundError(productId);
    }

    throw new InvalidStockCompletionError(productId, quantity);
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