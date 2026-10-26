"use client";

import { useRouter } from "next/navigation";
import { PlanCard, type Plan } from "@/components/app/billing/PlanCard";

/**
 * The billing plan cards, for visitors: there is no session to check out with yet, so every
 * upgrade goes through signup first (checkout then happens from Paramètres → Facturation).
 */
export function PricingPlans({ plans, recommended }: { plans: Plan[]; recommended: string }) {
  const router = useRouter();
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.key}
          plan={plan}
          highlighted={plan.key === recommended}
          onUpgrade={() => router.push("/signup")}
        />
      ))}
    </div>
  );
}
