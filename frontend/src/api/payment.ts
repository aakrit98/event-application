import apiClient from "./client";
import type { InitiatePaymentResponse, TicketOrder, OrderWithDetails } from "../types";

export async function initiatePayment(
  ticketId: number,
  quantity: number
): Promise<InitiatePaymentResponse> {
  const res = await apiClient.post<InitiatePaymentResponse>("/payments/initiate", {
    ticketId,
    quantity,
  });
  return res.data;
}

export async function getOrder(orderId: number): Promise<TicketOrder> {
  const res = await apiClient.get<{ order: TicketOrder }>(`/payments/orders/${orderId}`);
  return res.data.order;
}

export async function getMyOrders(): Promise<OrderWithDetails[]> {
  const res = await apiClient.get<{ orders: OrderWithDetails[] }>("/payments/my-orders");
  return res.data.orders;
}

export function submitToEsewa(paymentUrl: string, formFields: Record<string, string>): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  Object.entries(formFields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}