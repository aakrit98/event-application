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

export async function createTicket(req: Request, res: Response): Promise<void> {
  const eventId = Number(req.params.id);
  const input = createTicketSchema.parse(req.body);

  const event = await eventService.getEventById(eventId);
  if (!event) {
    res.status(404).json({ error: "Event not found." });
    return;
  }
  if (event.event_type !== "private") {
    res.status(400).json({
      error: "Tickets can only be created for private events. Set the event to private first.",
    });
    return;
  }

  const ticket = await ticketService.createTicket(eventId, input);
  res.status(201).json({ ticket });
}

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