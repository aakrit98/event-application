import { db } from "../db/connection";

export interface NotificationRow {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  event_id: number | null;
  is_read: boolean;
  created_at: Date;
}

export async function createNotification(params: {
  userId: number;
  type: string;
  title: string;
  message: string;
  eventId?: number | null;
}): Promise<void> {
  await db("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    event_id: params.eventId ?? null,
    is_read: false,
  });
}

export async function getNotificationsForUser(
  userId: number,
  limit = 20
): Promise<{ notifications: NotificationRow[]; unreadCount: number }> {
  const [notifications, unreadCount] = await Promise.all([
    db<NotificationRow>("notifications")
      .where({ user_id: userId })
      .orderBy("created_at", "desc")
      .limit(limit),
    db("notifications")
      .where({ user_id: userId, is_read: false })
      .count<{ count: string }[]>("id as count")
      .first(),
  ]);

  return { notifications, unreadCount: Number(unreadCount?.count ?? 0) };
}

export async function markAllRead(userId: number): Promise<void> {
  await db("notifications")
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true });
}