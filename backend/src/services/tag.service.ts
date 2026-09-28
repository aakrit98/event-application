import { db } from "../db/connection";

export interface TagRow {
  id: number;
  name: string;
}

// Single source of truth for the fixed tag list. Kept in sync with
// src/db/migrations/20260917000001_seed_default_tags.ts.
export const DEFAULT_TAGS = [
  "Concert",
  "Tech",
  "Conference",
  "Music",
  "Art Gallery",
  "Workshop",
  "Sports",
  "Networking",
  "Business",
  "Food & Drinks",
  "Dance",
  "Festival",
  "Exhibition",
  "Charity",
  "Community",
  "Meetup",
  "Other",
];

export async function listTags(): Promise<TagRow[]> {
  return db<TagRow>("tags").select("id", "name").orderBy("name", "asc");
}

// Makes sure every default tag exists, inserting only the ones that are
// missing. This runs on server startup so the tag dropdown is populated on
// every machine even if its database already had old migration history
// (which would never re-run the seed migration above).
export async function ensureDefaultTags(): Promise<void> {
  try {
    await Promise.all(
      DEFAULT_TAGS.map((name) =>
        db("tags").insert({ name }).onConflict("name").ignore()
      )
    );
  } catch (err) {
    // If the tags table doesn't exist yet (migrations not run), log and
    // continue — the API will still start, and listTags() will surface the
    // real error if the frontend calls it.
    console.warn("Could not ensure default tags:", (err as Error).message);
  }
}