import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import path from "path";
import { Pool, type PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Opt-in: point TEST_DATABASE_URL at a disposable database (never the dev DB) — this suite
// runs the migration chain on it and TRUNCATEs every table before each test.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const pointsAtDevDb = Boolean(testDatabaseUrl) && testDatabaseUrl === process.env.DATABASE_URL;

const ORG = "50000000-0000-4000-8000-000000000001";
const OTHER_ORG = "50000000-0000-4000-8000-000000000002";
const OWNER = "30000000-0000-4000-8000-000000000001";
const EDITOR = "30000000-0000-4000-8000-000000000002";
const VIEWER = "30000000-0000-4000-8000-000000000003";
const OUTSIDER = "30000000-0000-4000-8000-000000000004";
const NEW_USER = "30000000-0000-4000-8000-000000000005";
const THEME = "40000000-0000-4000-8000-000000000001";
const DECK = "20000000-0000-4000-8000-000000000001";
const SLIDE = "10000000-0000-4000-8000-000000000001";

describe.skipIf(!testDatabaseUrl || pointsAtDevDb)("RLS policies", () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({ connectionString: testDatabaseUrl });
    await migrate(drizzle({ client: pool }), {
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });
  });

  afterAll(async () => {
    await pool?.end();
  });

  beforeEach(async () => {
    const { rows } = await pool.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );
    await pool.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`);
    await seed();
  });

  /** Runs one statement as `authenticated` with the given user's JWT claims (as Supabase does). */
  async function queryAs(userId: string | null, sql: string, params: unknown[] = []) {
    const client: PoolClient = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE authenticated");
      const claims = userId ? { sub: userId, role: "authenticated" } : {};
      await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
      const result = await client.query(sql, params);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /** Two orgs; ORG has an owner, an editor and a viewer, plus a deck with one slide. */
  async function seed() {
    await pool.query(
      `INSERT INTO organizations (id, name, slug) VALUES ($1, 'Test Org', 'test-org'), ($2, 'Other Org', 'other-org')`,
      [ORG, OTHER_ORG]
    );
    for (const id of [OWNER, EDITOR, VIEWER, OUTSIDER, NEW_USER]) {
      await pool.query(`INSERT INTO profiles (id, email) VALUES ($1, $2)`, [id, `${id.slice(-1)}@test.com`]);
    }
    await pool.query(
      `INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, 'owner'), ($1, $3, 'editor'), ($1, $4, 'viewer'), ($5, $6, 'owner')`,
      [ORG, OWNER, EDITOR, VIEWER, OTHER_ORG, OUTSIDER]
    );
    await pool.query(
      `INSERT INTO themes (id, name, tokens, is_system) VALUES ($1, 'System Theme', '{"id":"test"}', true)`,
      [THEME]
    );
    await pool.query(
      `INSERT INTO decks (id, org_id, owner_id, title, theme_id, present_token) VALUES ($1, $2, $3, 'Test Deck', $4, 'token123')`,
      [DECK, ORG, OWNER, THEME]
    );
    await pool.query(
      `INSERT INTO slides (id, deck_id, position, type, content) VALUES ($1, $2, 0, 'cover', '{"title":"Test"}')`,
      [SLIDE, DECK]
    );
  }

  it("enables RLS on every public table", async () => {
    const { rows } = await pool.query<{ relname: string }>(
      `SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`
    );
    expect(rows.map((r) => r.relname)).toEqual([]);
  });

  it("the server's own connection role still sees every org (RLS bypassed by owner/superuser)", async () => {
    const { rows } = await pool.query(`SELECT id FROM organizations`);
    expect(rows).toHaveLength(2);
  });

  it("a request without a user sees nothing", async () => {
    for (const table of ["organizations", "decks", "slides", "themes", "profiles"]) {
      const { rows } = await queryAs(null, `SELECT * FROM ${table}`);
      expect(rows, table).toHaveLength(0);
    }
  });

  describe("organizations", () => {
    it("members read their org only", async () => {
      const { rows } = await queryAs(EDITOR, `SELECT id FROM organizations`);
      expect(rows.map((r) => r.id)).toEqual([ORG]);
    });

    it("owner can rename the org; a viewer's update touches no row", async () => {
      expect((await queryAs(VIEWER, `UPDATE organizations SET name = 'X' WHERE id = $1`, [ORG])).rowCount).toBe(0);
      expect((await queryAs(OWNER, `UPDATE organizations SET name = 'New' WHERE id = $1`, [ORG])).rowCount).toBe(1);
    });

    it("clients cannot create organizations", async () => {
      await expect(
        queryAs(OUTSIDER, `INSERT INTO organizations (name, slug) VALUES ('Mine', 'mine')`)
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("profiles", () => {
    it("users read their own and co-members' profiles, not outsiders'", async () => {
      const { rows } = await queryAs(VIEWER, `SELECT id FROM profiles ORDER BY id`);
      expect(rows.map((r) => r.id)).toEqual([OWNER, EDITOR, VIEWER]);
    });

    it("users can only update their own profile", async () => {
      expect((await queryAs(VIEWER, `UPDATE profiles SET full_name = 'X' WHERE id = $1`, [OWNER])).rowCount).toBe(0);
      expect((await queryAs(VIEWER, `UPDATE profiles SET full_name = 'Me' WHERE id = $1`, [VIEWER])).rowCount).toBe(1);
    });
  });

  describe("memberships", () => {
    it("members read their org's memberships", async () => {
      const { rows } = await queryAs(EDITOR, `SELECT user_id FROM memberships WHERE org_id = $1`, [ORG]);
      expect(rows).toHaveLength(3);
    });

    it("owner can add a member", async () => {
      await queryAs(OWNER, `INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, 'viewer')`, [ORG, NEW_USER]);
      const { rows } = await pool.query(`SELECT 1 FROM memberships WHERE user_id = $1`, [NEW_USER]);
      expect(rows).toHaveLength(1);
    });

    it("a viewer cannot add members", async () => {
      await expect(
        queryAs(VIEWER, `INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, 'viewer')`, [ORG, NEW_USER])
      ).rejects.toThrow(/row-level security/);
    });

    it("a user cannot join another org by inserting their own membership", async () => {
      await expect(
        queryAs(OUTSIDER, `INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, 'owner')`, [ORG, OUTSIDER])
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("decks and slides", () => {
    it("members read the org's decks and slides; outsiders read neither", async () => {
      expect((await queryAs(VIEWER, `SELECT id FROM decks`)).rows).toHaveLength(1);
      expect((await queryAs(VIEWER, `SELECT id FROM slides`)).rows).toHaveLength(1);
      expect((await queryAs(OUTSIDER, `SELECT id FROM decks`)).rows).toHaveLength(0);
      expect((await queryAs(OUTSIDER, `SELECT id FROM slides`)).rows).toHaveLength(0);
    });

    it("soft-deleted decks and their slides are hidden", async () => {
      await pool.query(`UPDATE decks SET deleted_at = now() WHERE id = $1`, [DECK]);
      expect((await queryAs(OWNER, `SELECT id FROM decks`)).rows).toHaveLength(0);
      expect((await queryAs(OWNER, `SELECT id FROM slides`)).rows).toHaveLength(0);
    });

    it("editors create decks and slides; viewers cannot", async () => {
      await queryAs(
        EDITOR,
        `INSERT INTO decks (org_id, owner_id, title, theme_id, present_token) VALUES ($1, $2, 'Editor Deck', $3, 'token456')`,
        [ORG, EDITOR, THEME]
      );
      await queryAs(
        EDITOR,
        `INSERT INTO slides (deck_id, position, type, content) VALUES ($1, 1, 'statement', '{"headline":"x"}')`,
        [DECK]
      );
      await expect(
        queryAs(
          VIEWER,
          `INSERT INTO decks (org_id, owner_id, title, theme_id, present_token) VALUES ($1, $2, 'Viewer Deck', $3, 'token789')`,
          [ORG, VIEWER, THEME]
        )
      ).rejects.toThrow(/row-level security/);
    });

    it("outsiders cannot write into another org's deck", async () => {
      expect((await queryAs(OUTSIDER, `UPDATE slides SET position = 9 WHERE id = $1`, [SLIDE])).rowCount).toBe(0);
      expect((await queryAs(OUTSIDER, `DELETE FROM decks WHERE id = $1`, [DECK])).rowCount).toBe(0);
      await expect(
        queryAs(OUTSIDER, `INSERT INTO slides (deck_id, position, type, content) VALUES ($1, 2, 'cover', '{}')`, [DECK])
      ).rejects.toThrow(/row-level security/);
    });
  });

  describe("themes and templates", () => {
    it("system themes are readable by any signed-in user; org themes only by members", async () => {
      await pool.query(
        `INSERT INTO themes (id, org_id, name, tokens, is_system) VALUES ('40000000-0000-4000-8000-000000000002', $1, 'Org Theme', '{"id":"org"}', false)`,
        [ORG]
      );
      expect((await queryAs(OUTSIDER, `SELECT id FROM themes`)).rows.map((r) => r.id)).toEqual([THEME]);
      expect((await queryAs(VIEWER, `SELECT id FROM themes`)).rows).toHaveLength(2);
    });

    it("system templates are readable by any signed-in user", async () => {
      await pool.query(
        `INSERT INTO templates (slug, name, category, theme_id, slide_count, config, is_system)
         VALUES ('test-template', 'Test Template', 'Test', $1, 10, '{}', true)`,
        [THEME]
      );
      expect((await queryAs(OUTSIDER, `SELECT slug FROM templates`)).rows).toHaveLength(1);
    });
  });

  describe("billing tables", () => {
    beforeEach(async () => {
      await pool.query(
        `INSERT INTO usage_counters (org_id, period_start, ai_credits_used, decks_created) VALUES ($1, '2026-09-01', 100, 5)`,
        [ORG]
      );
      await pool.query(
        `INSERT INTO subscriptions (org_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_start, current_period_end)
         VALUES ($1, 'cus_test', 'sub_test', 'pro', 'active', '2026-09-01', '2026-10-01')`,
        [ORG]
      );
    });

    it("owners read usage and subscription; editors and viewers do not", async () => {
      expect((await queryAs(OWNER, `SELECT 1 FROM usage_counters`)).rows).toHaveLength(1);
      expect((await queryAs(OWNER, `SELECT 1 FROM subscriptions`)).rows).toHaveLength(1);
      expect((await queryAs(EDITOR, `SELECT 1 FROM subscriptions`)).rows).toHaveLength(0);
      expect((await queryAs(VIEWER, `SELECT 1 FROM usage_counters`)).rows).toHaveLength(0);
    });

    it("no client can write credits, even an owner", async () => {
      expect((await queryAs(OWNER, `UPDATE usage_counters SET ai_credits_used = 0`)).rowCount).toBe(0);
    });
  });
});
