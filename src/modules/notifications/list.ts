import { desc, isNull } from "drizzle-orm";

import { db } from "../../db";
import { notifications } from "../../db/schema";

export type ListNotificationsInput = {
  unreadOnly?: boolean;
  limit?: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function listNotifications({
  unreadOnly = false,
  limit = DEFAULT_LIMIT,
}: ListNotificationsInput = {}) {
  const normalizedLimit = Math.min(
    Math.max(Math.trunc(limit), 1),
    MAX_LIMIT,
  );

  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      productId: notifications.productId,
      title: notifications.title,
      message: notifications.message,
      stockReal: notifications.stockReal,
      stockComprometido: notifications.stockComprometido,
      stockDisponible: notifications.stockDisponible,
      stockMinimo: notifications.stockMinimo,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      unreadOnly
        ? isNull(notifications.readAt)
        : undefined,
    )
    .orderBy(desc(notifications.createdAt))
    .limit(normalizedLimit);
}