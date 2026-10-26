import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

export async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile ?? null;
}

export async function updateProfile(
  userId: string,
  data: { fullName?: string | null; locale?: string }
) {
  const [updated] = await db
    .update(profiles)
    .set({
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.locale ? { locale: data.locale } : {}),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId))
    .returning();
  return updated ?? null;
}

