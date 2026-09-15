import { Request, Response } from "express";
import { createTicketSchema, updateTicketSchema } from "../validation/ticket.validation";
import * as ticketService from "../services/ticket.service";
import * as eventService from "../services/event.service";

export async function listEventTickets(req: Request, res: Response): Promise<void> {
  const eventId = Number(req.params.id);
  if (Number.isNaN(eventId)) {
    res.status(400).json({ error: "Invalid event ID." });
    return;
  }

  const tickets = await ticketService.listTicketsForEvent(eventId);
  res.status(200).json({ tickets });
}

// By the time this runs, requireAuth + requireEventOwnership have already
// confirmed the event exists and belongs to req.user.
export async function createTicket(req: Request, res: Response): Promise<void> {
  const eventId = Number(req.params.id);
  const input = createTicketSchema.parse(req.body);

  const event = await eventService.getEventById(eventId);
  if (!event) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  // Public events use price=0 tickets (free "seats" with a capacity
  // limit); private events use priced tickets that go through eSewa.
  // Both are now valid — this used to be restricted to private events
  // only, but the same capacity-tracking system works for free RSVPs too.
  const ticket = await ticketService.createTicket(eventId, input);
  res.status(201).json({ ticket });
}

// By the time this runs, requireAuth + requireTicketOwnership have
// already confirmed the ticket exists and belongs to an event req.user owns.
export async function updateTicket(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const input = updateTicketSchema.parse(req.body);

  const ticket = await ticketService.updateTicket(id, input);
  res.status(200).json({ ticket });
}

export async function deleteTicket(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await ticketService.deleteTicket(id);
  res.status(200).json({ message: "Ticket deleted." });
}