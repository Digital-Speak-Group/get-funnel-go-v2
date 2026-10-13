"use client";

import { Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/patterns/EmptyState";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { CurrentPlanSummary, type SubscriptionInfo } from "@/components/app/billing/CurrentPlanSummary";
import { PlanCard, type Plan } from "@/components/app/billing/PlanCard";
import { UsageMeter } from "@/components/app/billing/UsageMeter";
import { billingMessages as m } from "@/components/app/billing/messages";

const NEXT_PLAN: Record<string, string | undefined> = { trial: "pro", pro: "agency" };

interface BillingClientProps {
  plans: Plan[];
  currentPlan: string;
  creditsUsed: number;
  creditsLimit: number;
  decksCreated: number;
  decksLimit: number;
  subscription: SubscriptionInfo;
}

export function BillingClient({
  plans,
  currentPlan,
  creditsUsed,
  creditsLimit,
  decksCreated,
  decksLimit,
  subscription,
}: BillingClientProps) {
  const current = plans.find((plan) => plan.key === currentPlan);
  const suggested = NEXT_PLAN[currentPlan];

  /** Resolves while the browser navigates to Stripe; rejects (after a toast) on failure. */
  const handleUpgrade = async (planKey: string) => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          returnUrl: window.location.href,
        }),
      });

      const data: unknown = await res.json();
      const url = typeof data === "object" && data !== null && "url" in data ? data.url : null;
      if (typeof url !== "string") throw new Error("checkout_failed");
      window.location.href = url;
    } catch (error) {
      toast.error(m.checkoutFailed);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={m.current.title}
        description={m.current.description}
        footer={
          suggested ? (
            <Button variant="ghost" size="sm" asChild>
              <a href="#plans">{m.current.comparePlans}</a>
            </Button>
          ) : undefined
        }
      >
        <CurrentPlanSummary
          planName={current?.name ?? currentPlan}
          priceLabel={current?.priceLabel ?? ""}
          subscription={subscription}
        />
      </SectionCard>

      <SectionCard title={m.usage.title} description={m.usage.description}>
        <div className="grid gap-6 sm:grid-cols-2">
          <UsageMeter used={creditsUsed} limit={creditsLimit} label={m.usage.credits} />
          <UsageMeter used={decksCreated} limit={decksLimit} label={m.usage.decks} />
        </div>
      </SectionCard>

      <SectionCard id="plans" className="scroll-mt-20" title={m.plans.title} description={m.plans.description}>
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              highlighted={plan.key === suggested}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={m.invoices.title} description={m.invoices.description}>
        {/* No invoice data source yet (no Stripe invoice sync): show the empty state, never placeholder rows. */}
        <EmptyState
          data-testid="billing-invoices-empty"
          size="compact"
          icon={Receipt}
          title={m.invoices.emptyTitle}
          description={m.invoices.emptyDescription}
        />
      </SectionCard>
    </div>
  );
}
