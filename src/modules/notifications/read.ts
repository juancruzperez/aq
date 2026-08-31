import { eq } from "drizzle-orm";

import { db } from "../../db";
import { notifications } from "../../db/schema";

export class NotificationNotFoundError extends Error {
  constructor(notificationId: string) {
    super(
      `La notificación ${notificationId} no existe.`,
    );

    this.name = "NotificationNotFoundError";
  }
}

export async function readNotification(
  notificationId: string,
) {
  const [notification] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1);

  if (!notification) {
    throw new NotificationNotFoundError(notificationId);
  }

  if (notification.readAt !== null) {
    return notification;
  }

  const [updatedNotification] = await db
    .update(notifications)
    .set({
      readAt: new Date(),
    })
    .where(eq(notifications.id, notificationId))
    .returning();

  return updatedNotification;
}