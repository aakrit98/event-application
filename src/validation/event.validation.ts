import { z } from "zod";

// --- Create / Update ---

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().trim().min(1, "Description is required"),
    location: z.string().trim().min(1, "Location is required").max(255),
    // z.coerce.date() accepts ISO strings (and most common date formats)
    // sent from the frontend and converts them into real JS Date objects,
    // which mysql2/Knex can insert directly into a datetime column.
    start_at: z.coerce.date({ error: "A valid start date/time is required" }),
    end_at: z.coerce.date().optional().nullable(),
    event_type: z.enum(["public", "private"]).default("public"),
    tagIds: z
      .array(z.number().int().positive())
      .min(1, "Please select at least one tag"),
    image_url: z.string().url().optional().nullable(),
  })
  .refine((data) => !data.end_at || data.end_at >= data.start_at, {
    message: "End date/time cannot be before the start date/time",
    path: ["end_at"],
  })
  // An event can only be posted from tomorrow onwards — no "today /
  // already in the past" start times. Compared against the server's local
  // start of tomorrow so "event on the 16th" is only allowed once the 16th
  // is actually the next calendar day.
  .refine((data) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return data.start_at.getTime() >= tomorrow.getTime();
  }, {
    message: "Events can only be created to start from tomorrow or later",
    path: ["start_at"],
  });

// Same shape as create, but every field is optional — a PATCH-style
// partial update where the user only sends the fields they're changing.
// (We keep the cross-field end_at >= start_at check separate since it
// only makes sense to enforce when both values are actually present.)
export const updateEventSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(1).optional(),
    location: z.string().trim().min(1).max(255).optional(),
    start_at: z.coerce.date().optional(),
    end_at: z.coerce.date().optional().nullable(),
    event_type: z.enum(["public", "private"]).optional(),
    tagIds: z.array(z.number().int().positive()).optional(),
    image_url: z.string().url().optional().nullable(),
  })
  .refine(
    (data) => !data.start_at || !data.end_at || data.end_at >= data.start_at,
    {
      message: "End date/time cannot be before the start date/time",
      path: ["end_at"],
    }
  );

// --- Query params for listing events (GET /events) ---

// Query params always arrive as strings, so we coerce them into the
// right types here rather than trusting the controller to parse them.
export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  // Explicit row offset. When provided it takes priority over the derived
  // (page - 1) * limit offset, which lets clients like the events list use
  // asymmetric page sizes (3 on page 1, then 6 per page afterwards).
  offset: z.coerce.number().int().nonnegative().optional(),
  timeframe: z.enum(["upcoming", "past", "all"]).default("all"),
  event_type: z.enum(["public", "private"]).optional(),
  tagIds: z
    .union([z.coerce.number().int().positive(), z.array(z.coerce.number().int().positive())])
    .optional()
    .transform((val) => (val === undefined ? undefined : Array.isArray(val) ? val : [val])),
  search: z.string().trim().optional(),
  sortBy: z.enum(["start_at", "created_at", "title"]).default("start_at"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  mine: z
    .enum(["true", "false", "1", "0"])
    .optional()
    .transform((val) => val === "true" || val === "1"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;