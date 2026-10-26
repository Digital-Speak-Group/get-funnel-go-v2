import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { organizations } from "@/lib/db/schema";

export async function getOrganization(ctx: { orgId: string }) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, ctx.orgId))
    .limit(1);
  return org ?? null;
}

export async function updateOrganization(
  ctx: { orgId: string },
  data: { name: string }
) {
  const [org] = await db
    .update(organizations)
    .set({
      name: data.name,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, ctx.orgId))
    .returning();
  return org ?? null;
}

