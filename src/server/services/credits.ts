import { db } from "@/lib/db/client";
import { getUsageCounter, incrementAiCredits } from "@/lib/db/repositories/usage";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

import { PLANS } from "./billing";

/** Monthly AI budget of a plan, in credit cents. PLANS[plan].credits is a number of decks, ~20 cents each. */
export function creditLimitCents(plan: string | null | undefined): number {
  return plan && plan in PLANS ? PLANS[plan as keyof typeof PLANS].credits * 20 : 0;
}

export async function reserveCredits(ctx: { orgId: string }, amountCents: number): Promise<boolean> {
  const currentMonth = new Date().toISOString().substring(0, 7) + "-01";

  // Check org limit
  const orgResult = await db.select({ plan: organizations.plan }).from(organizations).where(eq(organizations.id, ctx.orgId)).limit(1);
  const maxLimit = creditLimitCents(orgResult[0]?.plan);

  const usage = await getUsageCounter(ctx, currentMonth);
  const used = usage?.aiCreditsUsed || 0;

  if (used + amountCents > maxLimit) {
    return false;
  }

  // Optimistic reserve (in real world we'd use a transaction and select for update)
  await incrementAiCredits(ctx, currentMonth, amountCents);
  return true;
}

export async function refundCredits(ctx: { orgId: string }, amountCents: number): Promise<void> {
  const currentMonth = new Date().toISOString().substring(0, 7) + "-01";
  await incrementAiCredits(ctx, currentMonth, -amountCents);
}
