import { billingMessages } from "@/components/app/billing/messages";
import type { Plan } from "@/components/app/billing/PlanCard";

/**
 * Public plan list for the marketing pages, in the shape the billing PlanCard takes.
 * Names and credits mirror PLANS in src/server/services/billing.ts, which cannot be imported
 * here (it instantiates Stripe and reads server env); price labels come from the billing copy.
 * Keep both in sync when plans change.
 */
const PUBLIC_PLANS = [
  { key: "trial", name: "Trial", credits: 1 },
  { key: "pro", name: "Pro", credits: 50 },
  { key: "agency", name: "Agency", credits: 500 },
] as const;

/** The plan highlighted as the recommended upgrade on the pricing page. */
export const RECOMMENDED_PLAN = "pro";

export const marketingPlans: Plan[] = PUBLIC_PLANS.map((p) => ({
  ...p,
  isCurrent: false,
  priceLabel: billingMessages.priceLabel[p.key] ?? "",
}));
