import { z } from "zod";

export const createTicketSchema = z.object({
  name: z.string().trim().min(1, "Ticket name is required").max(100),
  price: z.coerce.number().nonnegative("Price cannot be negative"),
  quantity_available: z.coerce
    .number()
    .int()
    .positive("Quantity available must be at least 1"),
  description: z.string().trim().max(1000).optional().nullable(),
});

export const updateTicketSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  price: z.coerce.number().nonnegative().optional(),
  quantity_available: z.coerce.number().int().positive().optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;