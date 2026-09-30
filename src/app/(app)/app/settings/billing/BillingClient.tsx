"use client";

import { PlanCard } from "@/components/app/billing/PlanCard";
import { UsageMeter } from "@/components/app/billing/UsageMeter";
import { Calendar, FileText, ExternalLink } from "lucide-react";

type Plan = {
  key: string;
  name: string;
  credits: number;
  isCurrent: boolean;
  priceLabel: string;
};

type SubscriptionInfo = {
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
} | null;

export function BillingClient({
  plans,
  currentPlan,
  creditsUsed,
  creditsLimit,
  decksCreated,
  decksLimit,
  subscription,
}: {
  plans: Plan[];
  currentPlan: string;
  creditsUsed: number;
  creditsLimit: number;
  decksCreated: number;
  decksLimit: number;
  subscription: SubscriptionInfo;
}) {
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

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail — the checkout route handles errors
    }
  };

  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null;

  const periodEndFormatted = periodEnd
    ? periodEnd.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">Facturation</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Gérez votre abonnement et suivez votre consommation.
        </p>
      </div>

      {/* Subscription status */}
      {subscription && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  Abonnement{" "}
                  <span className="capitalize text-purple-400">
                    {currentPlan}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  {subscription.cancelAtPeriodEnd
                    ? `Annulation prévue le ${periodEndFormatted}`
                    : subscription.status === "active"
                    ? `Renouvellement le ${periodEndFormatted}`
                    : `Statut : ${subscription.status}`}
                </p>
              </div>
            </div>

            {subscription.status === "active" && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Actif
              </span>
            )}
          </div>
        </div>
      )}

      {/* Usage meters */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
          Consommation ce mois
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageMeter
            used={creditsUsed}
            limit={creditsLimit}
            label="Crédits AI (centimes)"
          />
          <UsageMeter
            used={decksCreated}
            limit={decksLimit}
            label="Decks créés"
          />
        </div>
      </div>

      {/* Plans */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide mb-3">
          Plans disponibles
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>
      </div>

      {/* Invoices link */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm font-medium text-zinc-300">Factures</p>
              <p className="text-xs text-zinc-500">
                Accédez à vos factures via le portail Stripe.
              </p>
            </div>
          </div>
          <a
            href="#"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Portail client
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
