import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("events", (table) => {
    table.increments("id").primary();
    table.string("title", 200).notNullable();
    table.text("description").notNullable();
    table.string("location", 255).notNullable();
    table.dateTime("start_at").notNullable();
    table.dateTime("end_at").nullable();
    table.enum("event_type", ["public", "private"], {
      useNative: true,
      enumName: "event_type_enum",
    }).notNullable().defaultTo("public");
    table
      .integer("creator_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();

    table.index("creator_id", "idx_events_creator_id");
    table.index("start_at", "idx_events_start_at");
    table.index("event_type", "idx_events_event_type");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("events");
}