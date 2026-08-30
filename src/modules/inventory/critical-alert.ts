import { and, eq, isNull } from "drizzle-orm";

import { notifications, products } from "../../db/schema";
import { db } from "../../db";

type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type CheckCriticalStockInput = {
  productId: string;
};

export type CriticalStockNotification = {
  id: string;
  productId: string;
  stockReal: number;
  stockComprometido: number;
  stockDisponible: number;
  stockMinimo: number;
};

export async function checkCriticalStock(
  tx: DatabaseTransaction,
  { productId }: CheckCriticalStockInput,
): Promise<CriticalStockNotification | null> {
  const productResult = await tx
    .select({
      id: products.id,
      name: products.name,
      stockReal: products.stockReal,
      stockComprometido: products.stockComprometido,
      stockMinimo: products.stockMinimo,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (productResult.length === 0) {
    return null;
  }

  const product = productResult[0];

  const stockDisponible =
    product.stockReal - product.stockComprometido;

  const esCritico = stockDisponible <= product.stockMinimo;

  if (!esCritico) {
    return null;
  }

  const existingNotification = await tx
    .select({
      id: notifications.id,
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.productId, product.id),
        eq(notifications.type, "STOCK_CRITICAL"),
        isNull(notifications.readAt),
      ),
    )
    .limit(1);

  if (existingNotification.length > 0) {
    return null;
  }

  const [notification] = await tx
    .insert(notifications)
    .values({
      type: "STOCK_CRITICAL",
      productId: product.id,
      title: `Stock crítico: ${product.name}`,
      message: `El producto ${product.name} alcanzó un stock disponible de ${stockDisponible}, por debajo o igual al mínimo configurado de ${product.stockMinimo}.`,
      stockReal: product.stockReal,
      stockComprometido: product.stockComprometido,
      stockDisponible,
      stockMinimo: product.stockMinimo,
    })
    .returning({
      id: notifications.id,
      productId: notifications.productId,
      stockReal: notifications.stockReal,
      stockComprometido: notifications.stockComprometido,
      stockDisponible: notifications.stockDisponible,
      stockMinimo: notifications.stockMinimo,
    });

  return notification;
}