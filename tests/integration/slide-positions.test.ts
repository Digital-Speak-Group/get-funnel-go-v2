import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { asc, eq } from "drizzle-orm";
import { decks, organizations, profiles, slides, themes } from "@/lib/db/schema";

// Opt-in: point TEST_DATABASE_URL at a disposable, migrated database (never the dev DB).
// This suite only deletes the rows it creates.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl;

const ORG_ID = "31000000-0000-4000-8000-000000000001";
const USER_ID = "31000000-0000-4000-8000-0000000000a1";
const THEME_ID = "31000000-0000-4000-8000-0000000000c1";
const DECK_ID = "31000000-0000-4000-8000-0000000000d1";
const ctx = { orgId: ORG_ID, userId: USER_ID };

type Repo = typeof import("@/lib/db/repositories/slides");
type Client = typeof import("@/lib/db/client");

// slides_deck_position_unique is checked row by row, so every position change must avoid
// transient duplicates (e2e: "reorder persists" failed with a unique violation).
describe.skipIf(!testDatabaseUrl)("Repository: slide positions", () => {
  let repo: Repo;
  let client: Client;

  async function order() {
    const rows = await client.db
      .select({ title: slides.content, position: slides.position })
      .from(slides)
      .where(eq(slides.deckId, DECK_ID))
      .orderBy(asc(slides.position));
    return rows.map((r) => `${r.position}:${(r.title as { title: string }).title}`);
  }

  async function seedSlides(titles: string[]) {
    const ids: string[] = [];
    for (const title of titles) {
      const slide = await repo.createSlide({ deckId: DECK_ID, type: "cover", content: { title } }, ctx);
      ids.push(slide!.id);
    }
    return ids;
  }

  beforeAll(async () => {
    client = await import("@/lib/db/client");
    repo = await import("@/lib/db/repositories/slides");
  });

  beforeEach(async () => {
    await client.db.insert(organizations).values({ id: ORG_ID, name: "Positions", slug: "slide-positions-test" });
    await client.db.insert(profiles).values({ id: USER_ID, email: "positions@test.com" });
    await client.db.insert(themes).values({ id: THEME_ID, orgId: ORG_ID, name: "T", tokens: {} });
    await client.db.insert(decks).values({
      id: DECK_ID,
      orgId: ORG_ID,
      ownerId: USER_ID,
      title: "Positions",
      themeId: THEME_ID,
      presentToken: "slide-positions-test-token",
    });
  });

  afterEach(async () => {
    await client.db.delete(organizations).where(eq(organizations.id, ORG_ID));
    await client.db.delete(profiles).where(eq(profiles.id, USER_ID));
  });

  afterAll(async () => {
    await client?.closePool();
  });

  it("reorders slides, including moving the last one to the top", async () => {
    const [a, b, c] = await seedSlides(["A", "B", "C"]);

    await expect(repo.reorderSlides(DECK_ID, [c, a, b], ctx)).resolves.toBe(true);
    expect(await order()).toEqual(["0:C", "1:A", "2:B"]);
  });

  it("rejects an order that does not name every slide exactly once", async () => {
    const [a, b] = await seedSlides(["A", "B", "C"]);

    await expect(repo.reorderSlides(DECK_ID, [b, a], ctx)).resolves.toBe(false);
    await expect(repo.reorderSlides(DECK_ID, [b, a, a], ctx)).resolves.toBe(false);
    expect(await order()).toEqual(["0:A", "1:B", "2:C"]);
  });

  it("duplicates into the middle by pushing every later slide down", async () => {
    const [a] = await seedSlides(["A", "B", "C"]);

    await repo.duplicateSlide(a, ctx);
    expect(await order()).toEqual(["0:A", "1:A", "2:B", "3:C"]);
  });

  it("closes the gap after a delete, so a later duplicate still fits", async () => {
    const [a, b] = await seedSlides(["A", "B", "C"]);

    await expect(repo.deleteSlide(b, ctx)).resolves.toBe(true);
    expect(await order()).toEqual(["0:A", "1:C"]);

    await repo.duplicateSlide(a, ctx);
    expect(await order()).toEqual(["0:A", "1:A", "2:C"]);
  });
});
