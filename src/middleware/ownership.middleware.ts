import { Request, Response, NextFunction } from "express";
import { getEventOwnerId } from "../services/event.service";


// Runs AFTER requireAuth (so req.user is guaranteed to exist) and
// BEFORE the update/delete controller functions. Fetches only the
// creator_id column — not the whole event — since that's all this
// check needs.
export async function requireEventOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    res.status(400).json({ error: "Invalid event ID." });
    return;
  }

  const ownerId = await getEventOwnerId(eventId);

  if (ownerId === null) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  if (ownerId !== req.user!.id) {
    res.status(403).json({ error: "You do not have permission to modify this event." });
    return;
  }

  next();
}