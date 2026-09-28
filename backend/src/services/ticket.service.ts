import { db } from "../db/connection";
import { CreateTicketInput, UpdateTicketInput } from "../validation/ticket.validation";

export interface TicketRow {
  id: number;
  event_id: number;
  name: string;
  price: string;
  quantity_available: number;
  quantity_sold: number;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function listTicketsForEvent(eventId: number): Promise<TicketRow[]> {
  return db<TicketRow>("tickets").where({ event_id: eventId }).orderBy("price", "asc");
}

export async function getTicketById(id: number): Promise<TicketRow | undefined> {
  return db<TicketRow>("tickets").where({ id }).first();
}

export async function getEventIdForTicket(ticketId: number): Promise<number | null> {
  const row = await db("tickets").where({ id: ticketId }).select("event_id").first();
  return row ? row.event_id : null;
}

export async function createTicket(
  eventId: number,
  data: CreateTicketInput
): Promise<TicketRow> {
  const [id] = await db("tickets").insert({
    event_id: eventId,
    name: data.name,
    price: data.price,
    quantity_available: data.quantity_available,
    description: data.description ?? null,
  });

  return (await getTicketById(id))!;
}

export async function updateTicket(
  id: number,
  data: UpdateTicketInput
): Promise<TicketRow | null> {
  const updateFields: Partial<TicketRow> & { updated_at?: Date } = {};
  if (data.name !== undefined) updateFields.name = data.name;
  if (data.price !== undefined) updateFields.price = String(data.price);
  if (data.quantity_available !== undefined) {
    updateFields.quantity_available = data.quantity_available;
  }
  if (data.description !== undefined) updateFields.description = data.description;

  if (Object.keys(updateFields).length > 0) {
    await db("tickets")
      .where({ id })
      .update({ ...updateFields, updated_at: db.fn.now() });
  }

  return (await getTicketById(id)) ?? null;
}

export async function deleteTicket(id: number): Promise<void> {
  await db("tickets").where({ id }).del();
}