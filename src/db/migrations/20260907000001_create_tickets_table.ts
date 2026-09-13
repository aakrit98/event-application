import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tickets", (table) => {
    table.increments("id").primary();
    table
      .integer("event_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table.string("name", 100).notNullable(); // e.g. "General Admission", "VIP"
    table.decimal("price", 10, 2).notNullable();
    table.integer("quantity_available").unsigned().notNullable();
    table.integer("quantity_sold").unsigned().notNullable().defaultTo(0);
    table.text("description").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();

    table.index("event_id", "idx_tickets_event_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tickets");
}