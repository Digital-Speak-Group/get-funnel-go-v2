import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { billingMessages as m } from "./messages";

export type SubscriptionInfo = {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
} | null;

interface CurrentPlanSummaryProps {
  planName: string;
  priceLabel: string;
  subscription: SubscriptionInfo;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function subscriptionLine(subscription: SubscriptionInfo): string {
  if (!subscription) return m.current.noSubscription;
  const periodEnd = formatDate(subscription.currentPeriodEnd);
  if (subscription.cancelAtPeriodEnd) return m.current.cancelsOn(periodEnd);
  if (subscription.status === "active") return m.current.renewsOn(periodEnd);
  return m.current.status(subscription.status);
}

/** Plan name, price, and the subscription's renewal / cancellation state. */
export function CurrentPlanSummary({ planName, priceLabel, subscription }: CurrentPlanSummaryProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-2 shadow-highlight">
          <CreditCard className="size-5 text-brand" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {m.current.subscription(planName)}
            <span className="ml-2 font-mono text-small tabular-nums text-muted-foreground">{priceLabel}</span>
          </p>
          <p className="text-small text-muted-foreground">{subscriptionLine(subscription)}</p>
        </div>
      </div>

      {subscription?.cancelAtPeriodEnd ? (
        <Badge variant="warning" className="self-start sm:self-auto">
          {m.current.canceling}
        </Badge>
      ) : subscription?.status === "active" ? (
        <Badge variant="success" className="self-start sm:self-auto">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          {m.current.active}
        </Badge>
      ) : null}
    </div>
  );
}
