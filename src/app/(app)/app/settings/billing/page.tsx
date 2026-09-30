import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { organizations, subscriptions, usageCounters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PLANS, type PlanType } from "@/server/services/billing";
import { BillingClient } from "./BillingClient";

export const metadata = { title: "Facturation — GetFunnels" };

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Fetch org
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.activeOrgId))
    .limit(1);

  if (!org) redirect("/login");

  // Fetch subscription
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, session.activeOrgId))
    .limit(1);

  // Fetch current month usage
  const currentMonth = new Date().toISOString().substring(0, 7) + "-01";
  const [usage] = await db
    .select()
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.orgId, session.activeOrgId),
        eq(usageCounters.periodStart, currentMonth)
      )
    )
    .limit(1);

  const currentPlan = (org.plan as PlanType) || "trial";
  const planConfig = PLANS[currentPlan] ?? PLANS.trial;
  const creditsUsed = usage?.aiCreditsUsed ?? 0;
  const creditsLimit = planConfig.credits * 20; // credits * 20 cents per deck
  const decksCreated = usage?.decksCreated ?? 0;
  const decksLimit = planConfig.credits;

  // Build plan list for client
  const plans = Object.entries(PLANS).map(([key, p]) => ({
    key,
    name: p.name,
    credits: p.credits,
    isCurrent: key === currentPlan,
    priceLabel:
      key === "trial"
        ? "Gratuit"
        : key === "pro"
        ? "29€ / mois"
        : "99€ / mois",
  }));

  return (
    <BillingClient
      plans={plans}
      currentPlan={currentPlan}
      creditsUsed={creditsUsed}
      creditsLimit={creditsLimit}
      decksCreated={decksCreated}
      decksLimit={decksLimit}
      subscription={
        subscription
          ? {
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : null
      }
    />
  );
}
