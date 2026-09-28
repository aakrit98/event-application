import type { Knex } from "knex";
import { db } from "../db/connection";
import { CreateEventInput, UpdateEventInput, ListEventsQuery } from "../validation/event.validation";
import { extend } from "zod/mini";


export interface EventRow {
  id: number;
  title: string;
  description: string;
  location: string;
  start_at: Date;
  end_at: Date | null;
  event_type: "public" | "private";
  creator_id: number;
  created_at: Date;
  updated_at: Date; 
  image_url : string | null;
}

export interface EventTag { 
    id:number; 
    name : string; 
} 

export interface EventWithTags extends EventRow { 
    tags  : EventTag[];
} 

export interface PaginatedEvents { 
    data : EventWithTags[]; 
    pagination : { 
        page: number; 
        limit : number; 
        total : number; 
        totalPages: number;
    };
} 

// Fetches tags for one or more events in a single query, then groups
// them by event_id. Used by both listEvents and getEventById so every
// event returned to the client always includes its tags.

async function getTagsForEvents(eventIds: number[]): Promise<Record<number, EventTag[]>> {
  if (eventIds.length === 0) return {};

  const rows = await db("event_tags as et")
    .join("tags as t", "t.id", "et.tag_id")
    .whereIn("et.event_id", eventIds)
    .select("et.event_id", "t.id as tag_id", "t.name as tag_name");

  const map: Record<number, EventTag[]> = {};
  for (const row of rows) {
    if (!map[row.event_id]) {
      map[row.event_id] = [];
    }
    map[row.event_id].push({ id: row.tag_id, name: row.tag_name });
  }
  return map;
}

// Shared between the data query and the count query so the two never
// drift out of sync — whatever narrows the results narrows the count too.
function applyEventFilters(
  qb: Knex.QueryBuilder,
  filters: ListEventsQuery & { creatorId?: number }
): void {
  const now = new Date();

  if (filters.timeframe === "upcoming") {
    qb.where("e.start_at", ">=", now);
  } else if (filters.timeframe === "past") {
    qb.where("e.start_at", "<", now);
  }

  if (filters.event_type) {
    qb.where("e.event_type", filters.event_type);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    qb.where((builder) => {
      builder
        .where("e.title", "like", term)
        .orWhere("e.description", "like", term)
        .orWhere("e.location", "like", term);
    });
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    qb.join("event_tags as et", "et.event_id", "e.id").whereIn("et.tag_id", filters.tagIds);
  }

  if (filters.creatorId !== undefined) {
    qb.where("e.creator_id", filters.creatorId);
  }
}

export async function listEvents(
  filters: ListEventsQuery & { creatorId?: number }
): Promise<PaginatedEvents> {
  // Use the explicit offset when the client provides one (it knows that
  // page 1 shows 3 events and later pages show 6), otherwise fall back to
  // the standard derived offset.
  const offset = filters.offset ?? (filters.page - 1) * filters.limit;
  const hasTagFilter = !!filters.tagIds && filters.tagIds.length > 0;

  const dataQuery = db<EventRow>("events as e").select("e.*");
  applyEventFilters(dataQuery, filters);
  if (hasTagFilter) {
    // Joining on event_tags can produce duplicate rows for events that
    // match more than one requested tag — group by the primary key to
    // collapse those back to one row per event.
    dataQuery.groupBy("e.id");
  }
  dataQuery
    .orderBy(`e.${filters.sortBy}`, filters.sortOrder)
    .limit(filters.limit)
    .offset(offset);

  const countQuery = db("events as e");
  applyEventFilters(countQuery, filters);
  const countResult = hasTagFilter
    ? await countQuery.countDistinct<{ count: string }[]>("e.id as count").first()
    : await countQuery.count<{ count: string }[]>("e.id as count").first();
  const total = Number(countResult?.count ?? 0);

  const events = await dataQuery;
  const eventIds = events.map((e) => e.id);
  const tagsByEvent = await getTagsForEvents(eventIds);

  const data: EventWithTags[] = events.map((e) => ({
    ...e,
    tags: tagsByEvent[e.id] || [],
  }));

  return {
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getEventById(id: number): Promise<EventWithTags | null> {
  const event = await db<EventRow>("events").where({ id }).first();
  if (!event) {
    return null;
  }

  const tagsByEvent = await getTagsForEvents([id]);
  return { ...event, tags: tagsByEvent[id] || [] };
}

export async function getEventOwnerId(id: number): Promise<number | null> {
  const row = await db("events").where({ id }).select("creator_id").first();
  return row ? row.creator_id : null;
}

export async function createEvent(
  creatorId: number,
  data: CreateEventInput
): Promise<EventWithTags> {
  const newId: number = await db.transaction(async (trx) => {
    const [id] = await trx("events").insert({
      title: data.title,
      description: data.description,
      location: data.location,
      start_at: data.start_at,
      end_at: data.end_at ?? null,
      event_type: data.event_type,
      creator_id: creatorId,
      image_url: data.image_url ?? null,
    });

    if (data.tagIds.length > 0) {
      await trx("event_tags").insert(
        data.tagIds.map((tagId : number) => ({ event_id: id, tag_id: tagId }))
      );
    }

    return id;
  });

  // Guaranteed non-null: we just created this row inside the transaction above.
  return (await getEventById(newId))!;
}

export async function updateEvent(
  id: number,
  data: UpdateEventInput
): Promise<EventWithTags | null> {
  await db.transaction(async (trx) => {
    const updateFields: Partial<EventRow> & { updated_at?: Date } = {};

    // Allow editing a past event's other fields without losing the ability
    // to keep its original (already-passed) start time, but block moving
    // the start to today or earlier. Equality check means "not touching
    // the current start_at" always passes.
    if (data.start_at !== undefined) {
      const existing = await trx("events").where({ id }).select("start_at").first();
      const unchanged =
        existing && new Date(existing.start_at).getTime() === data.start_at.getTime();

      if (!unchanged) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        if (data.start_at.getTime() < tomorrow.getTime()) {
          throw new Error("EVENT_START_TOO_SOON");
        }
      }
      updateFields.start_at = data.start_at;
    }

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.location !== undefined) updateFields.location = data.location;
    if (data.end_at !== undefined) updateFields.end_at = data.end_at;
    if (data.event_type !== undefined) updateFields.event_type = data.event_type;
if (data.image_url !== undefined) updateFields.image_url = data.image_url;

    if (Object.keys(updateFields).length > 0) {
      await trx("events").where({ id }).update({ ...updateFields, updated_at: trx.fn.now() });
    }

    // Only touch tags if tagIds was actually included in the request —
    // this lets a caller update just the title without wiping tags.
    if (data.tagIds !== undefined) {
      await trx("event_tags").where({ event_id: id }).del();
      if (data.tagIds.length > 0) {
        await trx("event_tags").insert(
          data.tagIds.map((tagId : Number) => ({ event_id: id, tag_id: tagId }))
        );
      }
    }
  });

  return getEventById(id);
}

export async function deleteEvent(id: number): Promise<void> {
  // event_tags rows are removed automatically via ON DELETE CASCADE.
  await db("events").where({ id }).del();
}