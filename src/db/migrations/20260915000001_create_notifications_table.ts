import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("notifications", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("type", 50).notNullable(); // e.g. "ticket_sold" | "ticket_purchased"
    table.string("title", 200).notNullable();
    table.text("message").notNullable();
    table
      .integer("event_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("events")
      .onDelete("CASCADE");
    table.boolean("is_read").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();

    table.index("user_id", "idx_notifications_user_id");
    table.index(["user_id", "is_read"], "idx_notifications_user_read");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("notifications");
}