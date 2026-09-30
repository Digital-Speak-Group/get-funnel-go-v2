"use client";

import { Check, Sparkles, Building2, Zap } from "lucide-react";
import { useState } from "react";

type Plan = {
  key: string;
  name: string;
  credits: number;
  isCurrent: boolean;
  priceLabel: string;
};

const PLAN_ICONS: Record<string, React.ElementType> = {
  trial: Zap,
  pro: Sparkles,
  agency: Building2,
};

const PLAN_FEATURES: Record<string, string[]> = {
  trial: [
    "1 deck par mois",
    "Thèmes système uniquement",
    "Présentateur basique",
  ],
  pro: [
    "50 decks par mois",
    "Thèmes personnalisés",
    "Présentateur avancé",
    "Exports PDF",
    "Support prioritaire",
  ],
  agency: [
    "500 decks par mois",
    "Thèmes et templates illimités",
    "Présentateur avancé + analytics",
    "Exports PDF & PPTX",
    "Support dédié",
    "Accès API",
  ],
};

export function PlanCard({
  plan,
  onUpgrade,
}: {
  plan: Plan;
  onUpgrade: (planKey: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const Icon = PLAN_ICONS[plan.key] ?? Sparkles;
  const features = PLAN_FEATURES[plan.key] ?? [];

  const handleUpgrade = async () => {
    setLoading(true);
    onUpgrade(plan.key);
  };

  return (
    <div
      className={`relative rounded-xl border p-6 transition-all duration-200 ${
        plan.isCurrent
          ? "border-purple-500/50 bg-purple-500/5 ring-1 ring-purple-500/20"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {plan.isCurrent && (
        <div className="absolute -top-3 left-4 rounded-full bg-purple-600 px-3 py-0.5 text-xs font-medium text-white">
          Plan actuel
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            plan.isCurrent
              ? "bg-purple-600/20 text-purple-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
          <p className="text-sm text-zinc-400">{plan.priceLabel}</p>
        </div>
      </div>

      <p className="text-sm text-zinc-400 mb-4">
        {plan.credits} crédit{plan.credits > 1 ? "s" : ""} / mois
      </p>

      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check
              className={`h-4 w-4 shrink-0 ${
                plan.isCurrent ? "text-purple-400" : "text-zinc-500"
              }`}
            />
            <span className="text-zinc-300">{feature}</span>
          </li>
        ))}
      </ul>

      {!plan.isCurrent && (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Redirection..." : "Passer au plan " + plan.name}
        </button>
      )}
    </div>
  );
}
