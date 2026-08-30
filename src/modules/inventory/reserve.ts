import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { products } from "../../db/schema";

type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type ReserveStockInput = {
  productId: string;
  quantity: number;
};

export type ReservedStock = {
  productId: string;
  quantity: number;
  stockReal: number;
  stockComprometido: number;
  stockDisponible: number;
};

export class InvalidQuantityError extends Error {
  constructor() {
    super("La cantidad solicitada debe ser un entero mayor que cero.");
    this.name = "InvalidQuantityError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`El producto ${productId} no existe.`);
    this.name = "ProductNotFoundError";
  }
}

export class InsufficientStockError extends Error {
  constructor(productId: string, quantity: number) {
    super(
      `No hay stock suficiente para reservar ${quantity} unidad(es) del producto ${productId}.`,
    );
    this.name = "InsufficientStockError";
  }
}

export async function reserveStock(
  tx: DatabaseTransaction,
  { productId, quantity }: ReserveStockInput,
): Promise<ReservedStock> {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new InvalidQuantityError();
  }

  const result = await tx
    .update(products)
    .set({
      stockComprometido: sql`${products.stockComprometido} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(
      sql`
        ${eq(products.id, productId)}
        AND ${products.stockReal} - ${products.stockComprometido} >= ${quantity}
      `,
    )
    .returning({
      id: products.id,
      stockReal: products.stockReal,
      stockComprometido: products.stockComprometido,
    });

  if (result.length === 0) {
    const product = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      throw new ProductNotFoundError(productId);
    }

    throw new InsufficientStockError(productId, quantity);
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