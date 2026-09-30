"use client";

import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useState } from "react";

export function UpgradeDialog({
  open,
  currentPlan,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  currentPlan: string;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const suggestedPlan = currentPlan === "trial" ? "pro" : "agency";
  const suggestedLabel = suggestedPlan === "pro" ? "Pro" : "Agency";

  const handleUpgrade = async () => {
    setLoading(true);
    onUpgrade(suggestedPlan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="h-7 w-7 text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-center text-xl font-bold text-white">
          Limite atteinte
        </h2>
        <p className="mb-6 text-center text-sm text-zinc-400 leading-relaxed">
          Vous avez atteint la limite de votre plan{" "}
          <span className="font-medium text-zinc-300 capitalize">{currentPlan}</span>.
          Passez au plan{" "}
          <span className="font-medium text-purple-400">{suggestedLabel}</span> pour
          continuer à créer des decks et générer du contenu AI.
        </p>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            "Redirection..."
          ) : (
            <>
              Passer au plan {suggestedLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl px-6 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-300"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
