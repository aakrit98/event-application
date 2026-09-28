import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("ticket_orders", (table) => {
    table.increments("id").primary();
    table
      .integer("ticket_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("tickets")
      .onDelete("CASCADE");
    table
      .integer("buyer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("quantity").unsigned().notNullable();
    table.decimal("total_amount", 10, 2).notNullable();
    table.string("transaction_uuid", 100).notNullable().unique();
    table
      .enum("status", ["pending", "completed", "failed"], {
        useNative: true,
        enumName: "ticket_order_status_enum",
      })
      .notNullable()
      .defaultTo("pending");
    table.string("esewa_transaction_code", 100).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();

    table.index("ticket_id", "idx_ticket_orders_ticket_id");
    table.index("buyer_id", "idx_ticket_orders_buyer_id");
    table.index("status", "idx_ticket_orders_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ticket_orders");
}