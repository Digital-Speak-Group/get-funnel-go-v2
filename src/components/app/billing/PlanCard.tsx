"use client";

import { useState } from "react";
import { cva } from "class-variance-authority";
import { Building2, Check, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { billingMessages as m } from "./messages";

export type Plan = {
  key: string;
  name: string;
  credits: number;
  isCurrent: boolean;
  priceLabel: string;
};

const PLAN_ICONS: Record<string, LucideIcon> = {
  trial: Zap,
  pro: Sparkles,
  agency: Building2,
};

const cardVariants = cva("relative flex h-full flex-col rounded-lg border p-5 transition-colors duration-150", {
  variants: {
    state: {
      current: "border-primary/40 bg-surface-2",
      highlighted: "border-border-strong bg-surface",
      default: "border-border bg-surface hover:border-border-strong",
    },
  },
  defaultVariants: { state: "default" },
});

interface PlanCardProps {
  plan: Plan;
  /** May return a promise; if it rejects, the button leaves its loading state. */
  onUpgrade: (planKey: string) => void | Promise<void>;
  /** The suggested next plan: gets the single primary button and a "Recommandé" badge. */
  highlighted?: boolean;
  className?: string;
}

export function PlanCard({ plan, onUpgrade, highlighted = false, className }: PlanCardProps) {
  const [loading, setLoading] = useState(false);
  const Icon = PLAN_ICONS[plan.key] ?? Sparkles;
  const features = m.planFeatures[plan.key] ?? [];
  // The free plan is never bought through checkout.
  const canCheckout = !plan.isCurrent && plan.key !== "trial";

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      await onUpgrade(plan.key);
    } catch {
      // A rejected upgrade (checkout failed) re-enables the button; success keeps the
      // "Redirection..." state while the browser navigates away.
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        cardVariants({ state: plan.isCurrent ? "current" : highlighted ? "highlighted" : "default" }),
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-9 items-center justify-center rounded-md border border-border-strong bg-surface-2 shadow-highlight">
          <Icon className={cn("size-4", plan.isCurrent ? "text-brand" : "text-muted-foreground")} aria-hidden="true" />
        </div>
        {plan.isCurrent ? (
          <Badge variant="brand">{m.plan.current}</Badge>
        ) : highlighted ? (
          <Badge variant="outline">{m.plan.recommended}</Badge>
        ) : null}
      </div>

      <h3 className="mt-4 text-h3 text-foreground">{plan.name}</h3>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-foreground">{plan.priceLabel}</p>
      <p className="mt-1 text-small text-muted-foreground">{m.plan.credits(plan.credits)}</p>

      <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-small text-muted-foreground">
            <Check
              className={cn("mt-0.5 size-3.5 shrink-0", plan.isCurrent ? "text-brand" : "text-faint")}
              aria-hidden="true"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {canCheckout && (
        <Button
          className="mt-5 w-full"
          variant={highlighted ? "default" : "secondary"}
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? m.plan.redirecting : m.plan.upgrade(plan.name)}
        </Button>
      )}
      {!plan.isCurrent && plan.key === "trial" && (
        <p className="mt-5 text-center text-small text-faint">{m.plan.includedOnSignup}</p>
      )}
    </div>
  );
}
