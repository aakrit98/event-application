export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Tag {
  id: number;
  name: string;
}

export type EventType = "public" | "private";

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string | null;
  event_type: EventType;
  creator_id: number;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  image_url: string | null;
}

export interface PaginatedEvents {
  data: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EventFormInput {
  title: string;
  description: string;
  location: string;
  start_at: string;
  end_at?: string | null;
  event_type: EventType;
  tagIds: number[];
  image_url?: string | null;
}

export interface Ticket {
  id: number;
  event_id: number;
  name: string;
  price: string;
  quantity_available: number;
  quantity_sold: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketFormInput {
  name: string;
  price: number;
  quantity_available: number;
  description?: string | null | undefined;
}

export type OrderStatus = "pending" | "completed" | "failed";

export interface TicketOrder {
  id: number;
  ticket_id: number;
  buyer_id: number;
  quantity: number;
  total_amount: string;
  transaction_uuid: string;
  status: OrderStatus;
  esewa_transaction_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends TicketOrder {
  ticket_name: string;
  event_id: number;
  event_title: string;
  event_start_at: string;
  event_location: string;
  event_image_url: string | null;
}

export interface EsewaFormFields {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export type InitiatePaymentResponse =
  | { paymentUrl: string; formFields: EsewaFormFields; orderId: number }
  | { free: true; orderId: number };

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  event_id: number | null;
  is_read: boolean;
  created_at: string;
}