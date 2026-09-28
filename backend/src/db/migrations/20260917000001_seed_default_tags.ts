import type { Knex } from "knex";

// The fixed list of event tags shown in the create-event dropdown.
// Existing names are kept (ignore duplicate), new ones are added so the
// list is the same on every fresh database.
const DEFAULT_TAGS = [
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

export async function up(knex: Knex): Promise<void> {
  await Promise.all(
    DEFAULT_TAGS.map((name) =>
      knex("tags").insert({ name }).onConflict("name").ignore()
    )
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex("tags").whereIn("name", DEFAULT_TAGS).del();
}