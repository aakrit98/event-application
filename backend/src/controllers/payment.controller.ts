import { Request, Response } from "express";
import { z } from "zod";
import * as orderService from "../services/order.service";
import * as paymentService from "../services/payment.service";
import { env } from "../config/env";

const initiatePaymentSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive(),
});

export async function initiatePayment(req: Request, res: Response): Promise<void> {
  const { ticketId, quantity } = initiatePaymentSchema.parse(req.body);

  let order;
  try {
    order = await orderService.createPendingOrder({
      ticketId,
      buyerId: req.user!.id,
      quantity,
    });
  } catch (err) {
    if (err instanceof orderService.TicketNotFoundError) {
      res.status(404).json({ error: "Ticket not found." });
      return;
    }
    if (err instanceof orderService.NotEnoughTicketsError) {
      res.status(400).json({ error: "Not enough tickets remaining." });
      return;
    }
    if (err instanceof orderService.EventFinishedError) {
      res.status(400).json({ error: "This event has already finished. Tickets are no longer available." });
      return;
    }
    throw err;
  }

  // Free tickets (price 0, typically for public events) never need to
  // touch eSewa at all — there's nothing to pay, so just mark the order
  // completed immediately. The reservation already happened safely
  // inside createPendingOrder above, so there's no risk of overselling.
  if (Number(order.total_amount) === 0) {
    await orderService.markOrderCompleted(order.transaction_uuid, "FREE");
    res.status(200).json({ free: true, orderId: order.id });
    return;
  }

  const formFields = paymentService.buildPaymentFormFields({
    amount: Number(order.total_amount),
    transactionUuid: order.transaction_uuid,
  });

  res.status(200).json({
    paymentUrl: env.esewa.paymentUrl,
    formFields,
    orderId: order.id,
  });
}

export async function handlePaymentSuccess(req: Request, res: Response): Promise<void> {
  const data = req.query.data as string | undefined;

  if (!data) {
    res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=missing_data`);
    return;
  }

  let decoded;
  try {
    decoded = paymentService.decodeEsewaResponse(data);
  } catch {
    res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=invalid_data`);
    return;
  }

  const signatureValid = paymentService.verifyResponseSignature(decoded);
  if (!signatureValid) {
    res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=signature_mismatch`);
    return;
  }

  const order = await orderService.getOrderByTransactionUuid(decoded.transaction_uuid);
  if (!order) {
    res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=order_not_found`);
    return;
  }

  try {
    const statusResult = await paymentService.checkTransactionStatus(
      decoded.total_amount,
      decoded.transaction_uuid
    );

    if (statusResult.status === "COMPLETE") {
      await orderService.markOrderCompleted(decoded.transaction_uuid, decoded.transaction_code);
      res.redirect(
        `${env.frontendOrigin}/payment-result?status=success&transactionUuid=${decoded.transaction_uuid}`
      );
      return;
    }

    await orderService.markOrderFailed(decoded.transaction_uuid);
    res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=not_complete`);
  } catch {
    res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=status_check_failed`);
  }
}

export async function handlePaymentFailure(req: Request, res: Response): Promise<void> {
  const data = req.query.data as string | undefined;

  if (data) {
    try {
      const decoded = paymentService.decodeEsewaResponse(data);
      await orderService.markOrderFailed(decoded.transaction_uuid);
    } catch {
      // Nothing more we can do if the failure payload itself is malformed.
    }
  }

  res.redirect(`${env.frontendOrigin}/payment-result?status=failed&reason=cancelled_or_failed`);
}

export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const orders = await orderService.getOrdersForBuyer(req.user!.id);
  res.status(200).json({ orders });
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid order ID." });
    return;
  }

  const order = await orderService.getOrderById(id);
  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  if (order.buyer_id !== req.user!.id) {
    res.status(403).json({ error: "You do not have permission to view this order." });
    return;
  }

  res.status(200).json({ order });
}