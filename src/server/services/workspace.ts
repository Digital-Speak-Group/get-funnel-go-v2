import "server-only";
import { getOrganization } from "@/lib/db/repositories/organizations";
import { getUsageCounter } from "@/lib/db/repositories/usage";
import { PLANS, type PlanType } from "@/server/services/billing";

export interface WorkspaceSummary {
  orgName: string;
  plan: PlanType;
  planName: string;
  creditsUsed: number;
  decksCreated: number;
  decksLimit: number;
}

export function currentPeriodStart(now = new Date()): string {
  return now.toISOString().substring(0, 7) + "-01";
}

/** Org identity + current-period usage. Single source for the shell meter and the billing page. */
export async function getWorkspaceSummary(ctx: { orgId: string }): Promise<WorkspaceSummary | null> {
  const [org, usage] = await Promise.all([
    getOrganization(ctx),
    getUsageCounter(ctx, currentPeriodStart()),
  ]);
  if (!org) return null;

  const plan = (org.plan in PLANS ? org.plan : "trial") as PlanType;
  const planConfig = PLANS[plan];

  return {
    orgName: org.name,
    plan,
    planName: planConfig.name,
    creditsUsed: usage?.aiCreditsUsed ?? 0,
    decksCreated: usage?.decksCreated ?? 0,
    decksLimit: planConfig.credits,
  };
}
