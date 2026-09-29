import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createDeck, getDeckById, listDecks, updateDeck, deleteDeck, rotatePresentToken, reorderSlides } from "@/server/services/decks";
import { getSlidesByDeckId } from "@/lib/db/repositories/slides";
import { db } from "@/lib/db/client";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getfunnels_test";

let pool: Pool;
let testDb: ReturnType<typeof drizzle<typeof schema>>;

async function setupDb() {
  pool = new Pool({ connectionString });
  testDb = drizzle({ client: pool, schema });

  // Run migrations
  const fs = await import("fs");
  const path = await import("path");
  const migrationsDir = path.resolve(process.cwd(), "drizzle");
  
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();
    
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await pool.query(sql);
    }
  }
}

async function teardownDb() {
  if (pool) {
    await pool.end();
  }
}

async function truncateAll() {
  const tables = [
    "deck_versions", "slides", "decks",
    "templates", "themes", "invites", "memberships", "profiles", "organizations"
  ];
  
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
}

function createTestOrg() {
  return {
    orgId: "50000000-0000-4000-8000-000000000001",
    userId: "30000000-0000-4000-8000-000000000001",
  };
}

describe("Deck Service Integration", () => {
  beforeAll(async () => {
    await setupDb();
  });

  afterAll(async () => {
    await teardownDb();
  });

  beforeEach(async () => {
    await truncateAll();
    
    // Create test org and membership
    const ctx = createTestOrg();
    await pool.query(
      `INSERT INTO organizations (id, name, slug, plan) VALUES ($1, $2, $3, $4)`,
      [ctx.orgId, "Test Org", "test-org", "pro"]
    );
    await pool.query(
      `INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3)`,
      [ctx.userId, "owner@test.com", "Owner User"]
    );
    await pool.query(
      `INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, $3)`,
      [ctx.orgId, ctx.userId, "owner"]
    );
    
    // Create a default theme
    await pool.query(
      `INSERT INTO themes (id, name, tokens, is_system) VALUES ($1, $2, $3, $4)`,
      ["40000000-0000-4000-8000-000000000001", "Test Theme", '{"id":"test"}', true]
    );
  });

  const ctx = createTestOrg();

  it("creates a deck with present_token", async () => {
    const deck = await createDeck(
      {
        title: "Mon Deck",
        description: "Description",
        themeId: "40000000-0000-4000-8000-000000000001",
        language: "fr",
      },
      ctx
    );

    expect(deck).toBeDefined();
    expect(deck.title).toBe("Mon Deck");
    expect(deck.presentToken).toBeDefined();
    expect(deck.presentToken).toHaveLength(32);
    expect(deck.theme).toBeDefined();
    expect(deck.slideCount).toBe(0);
  });

  it("gets deck by id with slides", async () => {
    const created = await createDeck(
      { title: "Test Deck", themeId: "40000000-0000-4000-8000-000000000001" },
      ctx
    );

    const deck = await getDeckById(created.id, ctx);

    expect(deck).toBeDefined();
    expect(deck?.id).toBe(created.id);
  });

  it("lists decks with pagination", async () => {
    await createDeck({ title: "Deck 1", themeId: "40000000-0000-4000-8000-000000000001" }, ctx);
    await createDeck({ title: "Deck 2", themeId: "40000000-0000-4000-8000-000000000001" }, ctx);
    await createDeck({ title: "Deck 3", themeId: "40000000-0000-4000-8000-000000000001" }, ctx);

    const result = await listDecks(ctx, { limit: 2, offset: 0 });
    expect(result.decks).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  it("updates deck", async () => {
    const created = await createDeck(
      { title: "Original", themeId: "40000000-0000-4000-8000-000000000001" },
      ctx
    );

    const updated = await updateDeck(created.id, { title: "Updated", status: "ready" }, ctx);

    expect(updated?.title).toBe("Updated");
    expect(updated?.status).toBe("ready");
  });

  it("soft deletes deck", async () => {
    const created = await createDeck(
      { title: "To Delete", themeId: "40000000-0000-4000-8000-000000000001" },
      ctx
    );

    const deleted = await deleteDeck(created.id, ctx);
    expect(deleted).toBe(true);

    const notFound = await getDeckById(created.id, ctx);
    expect(notFound).toBeNull();
  });

  it("rotates present token", async () => {
    const created = await createDeck(
      { title: "Token Test", themeId: "40000000-0000-4000-8000-000000000001" },
      ctx
    );

    const oldToken = created.presentToken;
    const newToken = await rotatePresentToken(created.id, ctx);

    expect(newToken).toBeDefined();
    expect(newToken).not.toBe(oldToken);
    expect(newToken).toHaveLength(32);

    const deck = await getDeckById(created.id, ctx);
    expect(deck?.presentToken).toBe(newToken);
  });

  it("reorders slides", async () => {
    const created = await createDeck(
      { title: "Reorder Test", themeId: "40000000-0000-4000-8000-000000000001" },
      ctx
    );

    // Add some slides
    for (let i = 0; i < 3; i++) {
      await db.insert(schema.slides).values({
        deckId: created.id,
        position: i,
        type: "statement",
        content: { headline: `Slide ${i + 1}` },
      });
    }

    const slideIds = (await getSlidesByDeckId(created.id, ctx)).map(s => s.id);
    const reversed = [...slideIds].reverse();

    await reorderSlides(created.id, reversed, ctx);

    const reordered = await getSlidesByDeckId(created.id, ctx);
    expect(reordered.map(s => s.id)).toEqual(reversed);
  });
});

describe("Slide Repository", () => {
  beforeAll(async () => {
    await setupDb();
  });

  afterAll(async () => {
    await teardownDb();
  });

  beforeEach(async () => {
    await truncateAll();
    
    const ctx = createTestOrg();
    await pool.query(
      `INSERT INTO organizations (id, name, slug, plan) VALUES ($1, $2, $3, $4)`,
      [ctx.orgId, "Test Org", "test-org", "pro"]
    );
    await pool.query(
      `INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3)`,
      [ctx.userId, "owner@test.com", "Owner User"]
    );
    await pool.query(
      `INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, $3)`,
      [ctx.orgId, ctx.userId, "owner"]
    );
    await pool.query(
      `INSERT INTO themes (id, name, tokens, is_system) VALUES ($1, $2, $3, $4)`,
      ["40000000-0000-4000-8000-000000000001", "Test Theme", '{"id":"test"}', true]
    );
  });

  const ctx = createTestOrg();

  it("creates and retrieves slides", async () => {
    const deck = await createDeck(
      { title: "Slide Test", themeId: "40000000-0000-4000-8000-000000000001" },
      ctx
    );

    const slideRepoCtx = { orgId: ctx.orgId, userId: ctx.userId };

    const slide = await db.insert(schema.slides).values({
      deckId: deck.id,
      position: 0,
      type: "statement",
      content: { headline: "Test Slide" },
    }).returning();

    expect(slide[0]).toBeDefined();

    const slides = await getSlidesByDeckId(deck.id, slideRepoCtx);
    expect(slides).toHaveLength(1);
    expect(slides[0].type).toBe("statement");
  });
});