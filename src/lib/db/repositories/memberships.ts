import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { memberships, profiles } from "@/lib/db/schema";

/**
 * The org a user lands in. Role enum order is owner < admin < editor < viewer,
 * so ascending order prefers the org where the user has the most authority.
 */
export async function getPrimaryMembership(userId: string) {
  const [membership] = await db
    .select({ orgId: memberships.orgId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.role))
    .limit(1);
  return membership ?? null;
}

/** Members of the org with their profile, owners first then by join date. */
export async function listOrgMembers(ctx: { orgId: string }) {
  return db
    .select({
      userId: memberships.userId,
      role: memberships.role,
      joinedAt: memberships.createdAt,
      email: profiles.email,
      fullName: profiles.fullName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(memberships)
    .innerJoin(profiles, eq(profiles.id, memberships.userId))
    .where(eq(memberships.orgId, ctx.orgId))
    .orderBy(asc(memberships.role), asc(memberships.createdAt));
}
