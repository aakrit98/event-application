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

function generateTransactionUuid(): string {
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

export async function createPendingOrder(params: {
  ticketId: number;
  buyerId: number;
  quantity: number;
}): Promise<OrderRow> {
  return db.transaction(async (trx) => {
    const ticket = await trx("tickets").where({ id: params.ticketId }).forUpdate().first();
    if (!ticket) {
      throw new TicketNotFoundError();
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
  await db("ticket_orders").where({ transaction_uuid: transactionUuid }).update({
    status: "completed",
    esewa_transaction_code: esewaTransactionCode,
    updated_at: db.fn.now(),
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