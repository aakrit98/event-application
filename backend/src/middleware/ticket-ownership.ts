import { Request, Response, NextFunction } from "express";
import { getEventIdForTicket } from "../services/ticket.service";
import { getEventOwnerId } from "../services/event.service";

export async function requireTicketOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ticketId = Number(req.params.id);

  if (Number.isNaN(ticketId)) {
    res.status(400).json({ error: "Invalid ticket ID." });
    return;
  }

  const eventId = await getEventIdForTicket(ticketId);
  if (eventId === null) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const ownerId = await getEventOwnerId(eventId);
  if (ownerId === null || ownerId !== req.user!.id) {
    res.status(403).json({ error: "You do not have permission to modify this ticket." });
    return;
  }

  next();
}