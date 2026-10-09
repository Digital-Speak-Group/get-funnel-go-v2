import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PLANS } from "@/server/services/billing";
import { getWorkspaceSummary } from "@/server/services/workspace";
import { BillingClient } from "./BillingClient";

export const metadata = { title: "Facturation — GetFunnels" };

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ctx = { orgId: session.activeOrgId };
  const [summary, [subscription]] = await Promise.all([
    getWorkspaceSummary(ctx),
    db.select().from(subscriptions).where(eq(subscriptions.orgId, ctx.orgId)).limit(1),
  ]);

  if (!summary) redirect("/login");

  const { plan: currentPlan, creditsUsed, decksCreated, decksLimit } = summary;
  const creditsLimit = PLANS[currentPlan].credits * 20; // credits * 20 cents per deck

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
