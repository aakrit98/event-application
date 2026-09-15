import apiClient from "./client";
import type { Ticket, TicketFormInput } from "../types";

export async function listEventTickets(eventId: number): Promise<Ticket[]> {
  const res = await apiClient.get<{ tickets: Ticket[] }>(`/events/${eventId}/tickets`);
  return res.data.tickets;
}

export async function createTicket(eventId: number, input: TicketFormInput): Promise<Ticket> {
  const res = await apiClient.post<{ ticket: Ticket }>(`/events/${eventId}/tickets`, input);
  return res.data.ticket;
}

export async function updateTicket(
  ticketId: number,
  input: Partial<TicketFormInput>
): Promise<Ticket> {
  const res = await apiClient.put<{ ticket: Ticket }>(`/tickets/${ticketId}`, input);
  return res.data.ticket;
}

export async function deleteTicket(ticketId: number): Promise<void> {
  await apiClient.delete(`/tickets/${ticketId}`);
}