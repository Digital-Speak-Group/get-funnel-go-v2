import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { memberships, organizations, profiles } from "@/lib/db/schema";

export type CreateOrganizationResult =
  | { ok: true; orgId: string }
  | { ok: false; reason: "SLUG_TAKEN" };

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === UNIQUE_VIOLATION;
}

/**
 * Creates an org with the given user as owner. Org, profile and membership are
 * written in one transaction so a half-onboarded user can't exist.
 */
export async function createOrganizationWithOwner(
  input: { name: string; slug: string },
  user: { id: string; email: string }
): Promise<CreateOrganizationResult> {
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, input.slug))
        .limit(1);
      if (existing) return { ok: false, reason: "SLUG_TAKEN" } as const;

      const [org] = await tx
        .insert(organizations)
        .values({ name: input.name, slug: input.slug, plan: "trial" })
        .returning({ id: organizations.id });

      await tx
        .insert(profiles)
        .values({ id: user.id, email: user.email })
        .onConflictDoNothing({ target: profiles.id });

      await tx.insert(memberships).values({ orgId: org.id, userId: user.id, role: "owner" });

      return { ok: true, orgId: org.id } as const;
    });
  } catch (err) {
    // A concurrent signup grabbed the slug between our check and insert.
    if (isUniqueViolation(err)) return { ok: false, reason: "SLUG_TAKEN" };
    throw err;
  }
}
