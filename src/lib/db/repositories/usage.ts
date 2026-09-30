import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { usageCounters, aiGenerations, type kindEnum } from "@/lib/db/schema";

export async function getUsageCounter(ctx: { orgId: string }, periodStart: string) {
  const result = await db
    .select()
    .from(usageCounters)
    .where(and(eq(usageCounters.orgId, ctx.orgId), eq(usageCounters.periodStart, periodStart)))
    .limit(1);
  return result[0] || null;
}

export async function incrementAiCredits(
  ctx: { orgId: string },
  periodStart: string,
  amount: number
) {
  await db
    .insert(usageCounters)
    .values({
      orgId: ctx.orgId,
      periodStart,
      aiCreditsUsed: amount,
    })
    .onConflictDoUpdate({
      target: [usageCounters.orgId, usageCounters.periodStart],
      set: { aiCreditsUsed: sql`${usageCounters.aiCreditsUsed} + ${amount}` },
    });
}

export async function logGeneration(
  ctx: { orgId: string; userId: string },
  data: {
    deckId?: string;
    kind: typeof kindEnum.enumValues[number];
    model: string;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    status: "pending" | "succeeded" | "failed";
    error?: string;
    durationMs: number;
  }
) {
  const [log] = await db
    .insert(aiGenerations)
    .values({
      id: crypto.randomUUID(), // we can just use crypto here since it's node 20+
      orgId: ctx.orgId,
      userId: ctx.userId,
      deckId: data.deckId ?? null,
      kind: data.kind,
      model: data.model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      costCents: data.costCents,
      status: data.status,
      error: data.error ?? null,
      durationMs: data.durationMs,
    })
    .returning();
  return log;
}
