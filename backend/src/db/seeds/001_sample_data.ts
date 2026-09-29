import type { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex("events").del();
  await knex("users").del();

  // Create sample password hash
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Create sample user
  const [userId] = await knex("users")
    .insert({
      name: "Demo User",
      email: "demo@example.com",
      password_hash: passwordHash,
    })
    .returning("id");

  const creatorId =
    typeof userId === "object" ? userId.id : userId;

  // Create sample events
  await knex("events").insert([
    {
      title: "Tech Conference 2026",
      description: "A technology conference for developers and IT professionals.",
      location: "Kathmandu",
      start_at: "2026-12-15 09:00:00",
      end_at: "2026-12-15 17:00:00",
      event_type: "public",
      creator_id: creatorId,
    },
    {
      title: "Birthday Celebration",
      description: "A private birthday celebration.",
      location: "Lalitpur",
      start_at: "2026-11-20 18:00:00",
      end_at: "2026-11-20 21:00:00",
      event_type: "private",
      creator_id: creatorId,
    },
  ]);
}