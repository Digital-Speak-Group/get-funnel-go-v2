import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { inArray } from "drizzle-orm";
import { organizations, profiles } from "@/lib/db/schema";

// Opt-in: point TEST_DATABASE_URL at a disposable, migrated database (never the dev DB).
// This suite only deletes the rows it creates.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl;

const USER = { id: "30000000-0000-4000-8000-0000000000a1", email: "onboarding@test.com" };
const OTHER_USER = { id: "30000000-0000-4000-8000-0000000000a2", email: "other@test.com" };
const SLUG_PREFIX = "onboarding-test-";

type Modules = {
  db: typeof import("@/lib/db/client").db;
  closePool: typeof import("@/lib/db/client").closePool;
  createOrganizationWithOwner: typeof import("@/server/services/onboarding").createOrganizationWithOwner;
  getPrimaryMembership: typeof import("@/lib/db/repositories/memberships").getPrimaryMembership;
};

describe.skipIf(!testDatabaseUrl)("Service: onboarding", () => {
  let m: Modules;

  beforeAll(async () => {
    // Import after DATABASE_URL is redirected so the pool connects to the test DB.
    const client = await import("@/lib/db/client");
    const onboarding = await import("@/server/services/onboarding");
    const repo = await import("@/lib/db/repositories/memberships");
    m = {
      db: client.db,
      closePool: client.closePool,
      createOrganizationWithOwner: onboarding.createOrganizationWithOwner,
      getPrimaryMembership: repo.getPrimaryMembership,
    };
  });

  afterEach(async () => {
    // Memberships cascade from both sides.
    const orgs = await m.db.select({ id: organizations.id, slug: organizations.slug }).from(organizations);
    const ours = orgs.filter((o) => o.slug.startsWith(SLUG_PREFIX)).map((o) => o.id);
    if (ours.length) await m.db.delete(organizations).where(inArray(organizations.id, ours));
    await m.db.delete(profiles).where(inArray(profiles.id, [USER.id, OTHER_USER.id]));
  });

  afterAll(async () => {
    await m?.closePool();
  });

  it("creates org, profile and owner membership the session can resolve", async () => {
    const result = await m.createOrganizationWithOwner({ name: "Acme", slug: `${SLUG_PREFIX}acme` }, USER);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await expect(m.getPrimaryMembership(USER.id)).resolves.toEqual({ orgId: result.orgId, role: "owner" });
  });

  it("reuses an existing profile", async () => {
    await m.db.insert(profiles).values(USER);

    const result = await m.createOrganizationWithOwner({ name: "Acme", slug: `${SLUG_PREFIX}acme` }, USER);

    expect(result.ok).toBe(true);
  });

  it("rejects a taken slug without writing anything", async () => {
    await m.createOrganizationWithOwner({ name: "Acme", slug: `${SLUG_PREFIX}acme` }, USER);

    const result = await m.createOrganizationWithOwner({ name: "Copy", slug: `${SLUG_PREFIX}acme` }, OTHER_USER);

    expect(result).toEqual({ ok: false, reason: "SLUG_TAKEN" });
    await expect(m.getPrimaryMembership(OTHER_USER.id)).resolves.toBeNull();
  });

  it("returns null for a user with no membership", async () => {
    await expect(m.getPrimaryMembership(OTHER_USER.id)).resolves.toBeNull();
  });
});
