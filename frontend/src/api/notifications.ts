import apiClient from "./client";
import type { Notification } from "../types";

export async function getNotifications(): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  const res = await apiClient.get<{ notifications: Notification[]; unreadCount: number }>(
    "/notifications"
  );
  return res.data;
}

export async function markAllRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}