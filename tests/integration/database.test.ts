import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb, isDbAvailable } from "../setup-integration";
import { organizations, profiles, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

describe.skipIf(!isDbAvailable())("integration: database", () => {
  it("creates and queries organization with memberships", async () => {
    const testDb = getTestDb();
    // Insert organization
    const [org] = await testDb
      .insert(organizations)
      .values({
        name: "Test Org",
        slug: "test-org",
        plan: "pro",
      })
      .returning();

    expect(org).toBeDefined();
    expect(org.id).toBeDefined();
    expect(org.name).toBe("Test Org");

    // Insert profiles
    const [profile1] = await testDb
      .insert(profiles)
      .values({
        id: "30000000-0000-4000-8000-000000000001",
        email: "owner@test.com",
        fullName: "Owner User",
      })
      .returning();

    const [profile2] = await testDb
      .insert(profiles)
      .values({
        id: "30000000-0000-4000-8000-000000000002",
        email: "editor@test.com",
        fullName: "Editor User",
      })
      .returning();

    // Insert memberships
    await testDb.insert(memberships).values([
      { orgId: org.id, userId: profile1.id, role: "owner" },
      { orgId: org.id, userId: profile2.id, role: "editor" },
    ]);

    // Query memberships
    const members = await testDb
      .select()
      .from(memberships)
      .where(eq(memberships.orgId, org.id));

    expect(members).toHaveLength(2);
    expect(members.map(m => m.role).sort()).toEqual(["editor", "owner"]);
  });

  it("enforces org isolation", async () => {
    const testDb = getTestDb();
    const [org1] = await testDb
      .insert(organizations)
      .values({ name: "Org 1", slug: "org-1" })
      .returning();

    const [org2] = await testDb
      .insert(organizations)
      .values({ name: "Org 2", slug: "org-2" })
      .returning();

    const [profile] = await testDb
      .insert(profiles)
      .values({ id: "30000000-0000-4000-8000-000000000003", email: "user@test.com" })
      .returning();

    await testDb.insert(memberships).values([
      { orgId: org1.id, userId: profile.id, role: "owner" },
    ]);

    // User should only see org1
    const members = await testDb
      .select()
      .from(memberships)
      .where(eq(memberships.userId, profile.id));

    expect(members).toHaveLength(1);
    expect(members[0].orgId).toBe(org1.id);
  });
});