import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createClient } from "@supabase/supabase-js";
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
  const toTimestamp = (dateStr?: string) => dateStr ? new Date(dateStr) : new Date();

  // 1. Organizations
  console.log("Seeding organizations...");
  for (const org of seedData.organizations) {
    await db.insert(schema.organizations).values({
      ...org,
      createdAt: toTimestamp(org.created_at),
      updatedAt: org.updated_at ? toTimestamp(org.updated_at) : new Date(),
    }).onConflictDoNothing({ target: schema.organizations.id });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // 2. Profiles and Auth Users
  console.log("Seeding profiles and auth users...");
  for (const profile of seedData.profiles) {
    // Create auth user first
    await supabase.auth.admin.createUser({
      id: profile.id,
      email: profile.email,
      password: process.env.SEED_DEMO_PASSWORD || "demo-password-123",
      email_confirm: true,
      user_metadata: { full_name: profile.full_name },
    });
    
    // Insert into profiles
    await db.insert(schema.profiles).values({
      ...profile,
      createdAt: toTimestamp(profile.created_at),
      updatedAt: profile.updated_at ? toTimestamp(profile.updated_at) : new Date(),
    }).onConflictDoNothing({ target: schema.profiles.id });
  }

  // 3. Memberships
  console.log("Seeding memberships...");
  for (const membership of seedData.memberships) {
    await db.insert(schema.memberships).values({
      ...membership,
      orgId: membership.org_id,
      userId: membership.user_id,
      createdAt: toTimestamp(membership.created_at),
    }).onConflictDoNothing({ target: [schema.memberships.orgId, schema.memberships.userId] });
  }

  // 4. Templates
  console.log("Seeding templates...");
  for (const template of seedData.templates) {
    await db.insert(schema.templates).values({
      ...template,
      orgId: template.org_id,
      themeId: template.theme_id,
      slideCount: template.slide_count,
      isSystem: template.is_system,
      createdAt: toTimestamp(template.created_at),
      updatedAt: template.updated_at ? toTimestamp(template.updated_at) : new Date(),
    }).onConflictDoNothing({ target: schema.templates.id });
  }

  // 6. Assets
  console.log("Seeding assets...");
  for (const asset of seedData.assets) {
    await db.insert(schema.assets).values({
      ...asset,
      orgId: asset.org_id,
      deckId: asset.deck_id,
      storagePath: asset.storage_path,
      mimeType: asset.mime_type,
      sizeBytes: asset.size_bytes,
      createdAt: toTimestamp(asset.created_at),
    }).onConflictDoNothing({ target: schema.assets.id });
  }

  // 7. Decks
  console.log("Seeding decks...");
  for (const deck of seedData.decks) {
    await db.insert(schema.decks).values({
      ...deck,
      orgId: deck.org_id,
      ownerId: deck.owner_id,
      themeId: deck.theme_id,
      templateId: deck.template_id,
      presentToken: deck.present_token,
      createdAt: toTimestamp(deck.created_at),
      updatedAt: deck.updated_at ? toTimestamp(deck.updated_at) : new Date(),
      deletedAt: deck.deleted_at ? toTimestamp(deck.deleted_at) : null,
    }).onConflictDoNothing({ target: schema.decks.id });
  }

  // 8. Slides
  console.log("Seeding slides...");
  for (const slide of seedData.slides) {
    await db.insert(schema.slides).values({
      ...slide,
      deckId: slide.deck_id,
      createdAt: toTimestamp(slide.created_at),
      updatedAt: slide.updated_at ? toTimestamp(slide.updated_at) : new Date(),
    }).onConflictDoNothing({ target: schema.slides.id });
  }

  // 9. Sessions
  console.log("Seeding sessions...");
  for (const session of seedData.sessions) {
    await db.insert(schema.sessions).values({
      ...session,
      deckId: session.deck_id,
      presenterId: session.presenter_id,
      presentToken: session.present_token,
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
      sessionId: event.session_id,
      slideIndex: event.slide_index,
      eventType: event.event_type,
      durationMs: event.duration_ms,
      createdAt: toTimestamp(event.created_at),
    }).onConflictDoNothing({ target: schema.sessionEvents.id });
  }

  // 11. AI generations
  console.log("Seeding AI generations...");
  for (const gen of seedData.ai_generations) {
    await db.insert(schema.aiGenerations).values({
      ...gen,
      orgId: gen.org_id,
      userId: gen.user_id,
      deckId: gen.deck_id,
      inputTokens: gen.input_tokens,
      outputTokens: gen.output_tokens,
      costCents: gen.cost_cents,
      durationMs: gen.duration_ms,
      createdAt: toTimestamp(gen.created_at),
    }).onConflictDoNothing({ target: schema.aiGenerations.id });
  }

  // 12. Usage counters
  console.log("Seeding usage counters...");
  for (const counter of seedData.usage_counters) {
    await db.insert(schema.usageCounters).values({
      ...counter,
      orgId: counter.org_id,
      periodStart: counter.period_start,
      aiCreditsUsed: counter.ai_credits_used,
      decksCreated: counter.decks_created,
    }).onConflictDoNothing({ target: [schema.usageCounters.orgId, schema.usageCounters.periodStart] });
  }

  // 13. Subscriptions
  console.log("Seeding subscriptions...");
  for (const sub of seedData.subscriptions) {
    await db.insert(schema.subscriptions).values({
      ...sub,
      orgId: sub.org_id,
      stripeCustomerId: sub.stripe_customer_id,
      stripeSubscriptionId: sub.stripe_subscription_id,
      currentPeriodStart: toTimestamp(sub.current_period_start),
      currentPeriodEnd: toTimestamp(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      createdAt: toTimestamp(sub.created_at),
      updatedAt: sub.updated_at ? toTimestamp(sub.updated_at) : new Date(),
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