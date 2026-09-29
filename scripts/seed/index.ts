import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { resolve } from "path";
import { seedThemes } from "./themes";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getfunnels";

const pool = new Pool({ connectionString });
const db = drizzle({ client: pool, schema });

// Load fake data
const seedData = JSON.parse(
  readFileSync(resolve(process.cwd(), "scripts/seed/fake-data.json"), "utf-8")
);

async function seed() {
  console.log("Starting seed...");

  // Seed system themes first
  await seedThemes();

  // Helper to convert date strings
  const toTimestamp = (dateStr: string) => new Date(dateStr);

  // 1. Organizations
  console.log("Seeding organizations...");
  for (const org of seedData.organizations) {
    await db.insert(schema.organizations).values({
      ...org,
      createdAt: toTimestamp(org.created_at),
      updatedAt: toTimestamp(org.updated_at),
    }).onConflictDoNothing({ target: schema.organizations.id });
  }

  // 2. Profiles
  console.log("Seeding profiles...");
  for (const profile of seedData.profiles) {
    await db.insert(schema.profiles).values({
      ...profile,
      createdAt: toTimestamp(profile.created_at),
      updatedAt: toTimestamp(profile.updated_at),
    }).onConflictDoNothing({ target: schema.profiles.id });
  }

  // 3. Memberships
  console.log("Seeding memberships...");
  for (const membership of seedData.memberships) {
    await db.insert(schema.memberships).values({
      ...membership,
      createdAt: toTimestamp(membership.created_at),
    }).onConflictDoNothing({ target: [schema.memberships.orgId, schema.memberships.userId] });
  }

  // 4. Templates
  console.log("Seeding templates...");
  for (const template of seedData.templates) {
    await db.insert(schema.templates).values({
      ...template,
      createdAt: toTimestamp(template.created_at),
      updatedAt: toTimestamp(template.updated_at),
    }).onConflictDoNothing({ target: schema.templates.id });
  }

  // 6. Assets
  console.log("Seeding assets...");
  for (const asset of seedData.assets) {
    await db.insert(schema.assets).values({
      ...asset,
      createdAt: toTimestamp(asset.created_at),
    }).onConflictDoNothing({ target: schema.assets.id });
  }

  // 7. Decks
  console.log("Seeding decks...");
  for (const deck of seedData.decks) {
    await db.insert(schema.decks).values({
      ...deck,
      createdAt: toTimestamp(deck.created_at),
      updatedAt: toTimestamp(deck.updated_at),
      deletedAt: deck.deleted_at ? toTimestamp(deck.deleted_at) : null,
    }).onConflictDoNothing({ target: schema.decks.id });
  }

  // 8. Slides
  console.log("Seeding slides...");
  for (const slide of seedData.slides) {
    await db.insert(schema.slides).values({
      ...slide,
      createdAt: toTimestamp(slide.created_at),
      updatedAt: toTimestamp(slide.updated_at),
    }).onConflictDoNothing({ target: schema.slides.id });
  }

  // 9. Sessions
  console.log("Seeding sessions...");
  for (const session of seedData.sessions) {
    await db.insert(schema.sessions).values({
      ...session,
      startedAt: toTimestamp(session.started_at),
      endedAt: session.ended_at ? toTimestamp(session.ended_at) : null,
      createdAt: toTimestamp(session.created_at),
    }).onConflictDoNothing({ target: schema.sessions.id });
  }

  // 10. Session events
  console.log("Seeding session events...");
  for (const event of seedData.session_events) {
    await db.insert(schema.sessionEvents).values({
      ...event,
      createdAt: toTimestamp(event.created_at),
    }).onConflictDoNothing({ target: schema.sessionEvents.id });
  }

  // 11. AI generations
  console.log("Seeding AI generations...");
  for (const gen of seedData.ai_generations) {
    await db.insert(schema.aiGenerations).values({
      ...gen,
      createdAt: toTimestamp(gen.created_at),
    }).onConflictDoNothing({ target: schema.aiGenerations.id });
  }

  // 12. Usage counters
  console.log("Seeding usage counters...");
  for (const counter of seedData.usage_counters) {
    await db.insert(schema.usageCounters).values({
      ...counter,
    }).onConflictDoNothing({ target: [schema.usageCounters.orgId, schema.usageCounters.periodStart] });
  }

  // 13. Subscriptions
  console.log("Seeding subscriptions...");
  for (const sub of seedData.subscriptions) {
    await db.insert(schema.subscriptions).values({
      ...sub,
      createdAt: toTimestamp(sub.created_at),
      updatedAt: toTimestamp(sub.updated_at),
    }).onConflictDoNothing({ target: schema.subscriptions.id });
  }

  console.log("Seed completed!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  pool.end();
  process.exit(1);
});