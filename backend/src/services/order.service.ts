import crypto from "crypto";
import { db } from "../db/connection";

export interface OrderRow {
  id: number;
  ticket_id: number;
  buyer_id: number;
  quantity: number;
  total_amount: string;
  transaction_uuid: string;
  status: "pending" | "completed" | "failed";
  esewa_transaction_code: string | null;
  created_at: Date;
  updated_at: Date;
}

export class NotEnoughTicketsError extends Error {
  constructor() {
    super("NOT_ENOUGH_TICKETS");
  }
}

export class TicketNotFoundError extends Error {
  constructor() {
    super("TICKET_NOT_FOUND");
  }
}

export class EventFinishedError extends Error {
  constructor() {
    super("EVENT_FINISHED");
  }
}

function generateTransactionUuid(): string {
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

export async function createPendingOrder(params: {
  ticketId: number;
  buyerId: number;
  quantity: number;
}): Promise<OrderRow> {
  return db.transaction(async (trx) => {
    const ticket = await trx("tickets as t")
      .join("events as e", "e.id", "t.event_id")
      .where("t.id", params.ticketId)
      .forUpdate()
      .select(
        "t.id",
        "t.event_id",
        "t.name",
        "t.price",
        "t.quantity_available",
        "t.quantity_sold",
        "t.description",
        "t.created_at",
        "t.updated_at",
        "e.start_at as event_start_at",
        "e.end_at as event_end_at"
      )
      .first();
    if (!ticket) {
      throw new TicketNotFoundError();
    }

    // Block purchase once the event has finished. If an end_at is set,
    // use that; otherwise fall back to start_at (single-point-in-time events).
    const eventEnd = ticket.event_end_at
      ? new Date(ticket.event_end_at)
      : new Date(ticket.event_start_at);
    if (Date.now() >= eventEnd.getTime()) {
      throw new EventFinishedError();
    }

    const remaining = ticket.quantity_available - ticket.quantity_sold;
    if (params.quantity > remaining) {
      throw new NotEnoughTicketsError();
    }

    const totalAmount = (Number(ticket.price) * params.quantity).toFixed(2);
    const transactionUuid = generateTransactionUuid();

    await trx("tickets")
      .where({ id: params.ticketId })
      .increment("quantity_sold", params.quantity);

    const [id] = await trx("ticket_orders").insert({
      ticket_id: params.ticketId,
      buyer_id: params.buyerId,
      quantity: params.quantity,
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      status: "pending",
    });

    return (await trx("ticket_orders").where({ id }).first()) as OrderRow;
  });
}

export interface OrderWithDetails extends OrderRow {
  ticket_name: string;
  event_id: number;
  event_title: string;
  event_start_at: Date;
  event_location: string;
  event_image_url: string | null;
}

export async function getOrdersForBuyer(buyerId: number): Promise<OrderWithDetails[]> {
  return db("ticket_orders as o")
    .join("tickets as t", "t.id", "o.ticket_id")
    .join("events as e", "e.id", "t.event_id")
    .where("o.buyer_id", buyerId)
    .select(
      "o.id",
      "o.ticket_id",
      "o.buyer_id",
      "o.quantity",
      "o.total_amount",
      "o.transaction_uuid",
      "o.status",
      "o.esewa_transaction_code",
      "o.created_at",
      "o.updated_at",
      "t.name as ticket_name",
      "e.id as event_id",
      "e.title as event_title",
      "e.start_at as event_start_at",
      "e.location as event_location",
      "e.image_url as event_image_url"
    )
    .orderBy("o.created_at", "desc");
}

export async function getOrderByTransactionUuid(
  transactionUuid: string
): Promise<OrderRow | undefined> {
  return db<OrderRow>("ticket_orders").where({ transaction_uuid: transactionUuid }).first();
}

export async function getOrderById(id: number): Promise<OrderRow | undefined> {
  return db<OrderRow>("ticket_orders").where({ id }).first();
}

export async function markOrderCompleted(
  transactionUuid: string,
  esewaTransactionCode: string
): Promise<void> {
  await db.transaction(async (trx) => {
    const order = await trx("ticket_orders")
      .where({ transaction_uuid: transactionUuid })
      .first();
    if (!order) return;

    await trx("ticket_orders")
      .where({ id: order.id })
      .update({
        status: "completed",
        esewa_transaction_code: esewaTransactionCode,
        updated_at: trx.fn.now(),
      });

    // Only notify on the pending -> completed transition. eSewa can hit the
    // success URL more than once (replay), so this guards against
    // duplicate notifications for the same purchase.
    if (order.status === "completed") return;

    const details = await trx("ticket_orders as o")
      .join("tickets as t", "t.id", "o.ticket_id")
      .join("events as e", "e.id", "t.event_id")
      .join("users as u", "u.id", "o.buyer_id")
      .where("o.id", order.id)
      .select(
        "o.buyer_id",
        "o.quantity",
        "o.total_amount",
        "u.name as buyer_name",
        "e.id as event_id",
        "e.title as event_title",
        "e.creator_id as event_creator_id"
      )
      .first();
    if (!details) return;

    const ticketWord = details.quantity > 1 ? "tickets" : "ticket";

    // Notify the organizer: someone bought their ticket.
    await trx("notifications").insert({
      user_id: details.event_creator_id,
      type: "ticket_sold",
      title: "New ticket sale",
      message: `${details.buyer_name} purchased ${details.quantity} ${ticketWord} for "${details.event_title}".`,
      event_id: details.event_id,
      is_read: false,
    });

    // Notify the buyer: their purchase was confirmed.
    await trx("notifications").insert({
      user_id: details.buyer_id,
      type: "ticket_purchased",
      title: "Purchase confirmed",
      message: `You successfully purchased ${details.quantity} ${ticketWord} for "${details.event_title}" (NPR ${details.total_amount}). See you there!`,
      event_id: details.event_id,
      is_read: false,
    });
  });
}

export async function markOrderFailed(transactionUuid: string): Promise<void> {
  await db.transaction(async (trx) => {
    const order = await trx("ticket_orders").where({ transaction_uuid: transactionUuid }).first();

    if (!order || order.status !== "pending") {
      return;
    }

    await trx("ticket_orders")
      .where({ id: order.id })
      .update({ status: "failed", updated_at: trx.fn.now() });

    await trx("tickets").where({ id: order.ticket_id }).decrement("quantity_sold", order.quantity);
  });
}