import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const result = await notificationService.getNotificationsForUser(req.user!.id);
  res.status(200).json(result);
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await notificationService.markAllRead(req.user!.id);
  res.status(200).json({ message: "All notifications marked as read." });
}