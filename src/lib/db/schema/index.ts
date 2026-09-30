import { pgTable, uuid, text, timestamp, pgEnum, boolean, jsonb, uniqueIndex, integer, date } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["owner", "admin", "editor", "viewer"]);
export const statusEnum = pgEnum("status", ["draft", "ready", "archived"]);
export const sessionStatusEnum = pgEnum("session_status", ["live", "ended"]);
export const eventTypeEnum = pgEnum("event_type", ["slide_view", "deck_open", "deck_close"]);
export const kindEnum = pgEnum("kind", ["brief", "plan", "slides", "slide", "review"]);
export const generationStatusEnum = pgEnum("generation_status", ["pending", "succeeded", "failed"]);
export const assetKindEnum = pgEnum("asset_kind", ["logo", "image", "export"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("trial"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  locale: text("locale").notNull().default("fr"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: uniqueIndex("memberships_pk").on(t.orgId, t.userId),
}));

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  email: text("email").notNull(),
  role: roleEnum("role").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => profiles.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const themes = pgTable("themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokens: jsonb("tokens").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  themeId: uuid("theme_id").references(() => themes.id),
  slideCount: text("slide_count").notNull(),
  config: jsonb("config").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const decks = pgTable("decks", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  ownerId: uuid("owner_id").references(() => profiles.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  themeId: uuid("theme_id").references(() => themes.id).notNull(),
  templateId: uuid("template_id").references(() => templates.id),
  status: statusEnum("status").notNull().default("draft"),
  presentToken: text("present_token").notNull().unique(),
  language: text("language").notNull().default("fr"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const slides = pgTable("slides", {
  id: uuid("id").defaultRandom().primaryKey(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").notNull(),
  type: text("type").notNull(),
  content: jsonb("content").notNull(),
  notes: text("notes"),
  script: text("script"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniquePosition: uniqueIndex("slides_deck_position_unique").on(t.deckId, t.position),
}));

export const deckVersions = pgTable("deck_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  createdBy: uuid("created_by").references(() => profiles.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqueVersion: uniqueIndex("deck_versions_deck_version_unique").on(t.deckId, t.version),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }).notNull(),
  presenterId: uuid("presenter_id").references(() => profiles.id).notNull(),
  status: sessionStatusEnum("status").notNull(),
  presentToken: text("present_token").notNull().unique(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessionEvents = pgTable("session_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  slideIndex: text("slide_index").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  durationMs: text("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiGenerations = pgTable("ai_generations", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => profiles.id).notNull(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "set null" }),
  kind: kindEnum("kind").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  costCents: integer("cost_cents").notNull(), // We use integer for cents
  status: generationStatusEnum("status").notNull(),
  error: text("error"),
  durationMs: integer("duration_ms").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageCounters = pgTable("usage_counters", {
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  periodStart: date("period_start").notNull(),
  aiCreditsUsed: integer("ai_credits_used").notNull().default(0),
  decksCreated: integer("decks_created").notNull().default(0),
}, (t) => ({
  pk: uniqueIndex("usage_counters_pk").on(t.orgId, t.periodStart),
}));

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assets = pgTable("assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }),
  kind: assetKindEnum("kind").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  width: text("width"),
  height: text("height"),
  sizeBytes: text("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});