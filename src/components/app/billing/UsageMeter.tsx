"use client";

import { TrendingUp } from "lucide-react";

export function UsageMeter({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const barColor = isAtLimit
    ? "bg-red-500"
    : isNearLimit
    ? "bg-amber-500"
    : "bg-purple-500";

  const textColor = isAtLimit
    ? "text-red-400"
    : isNearLimit
    ? "text-amber-400"
    : "text-purple-400";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className={`h-4 w-4 ${textColor}`} />
          <span className="text-sm font-medium text-zinc-300">{label}</span>
        </div>
        <span className={`text-sm font-mono ${textColor}`}>
          {used} / {limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isAtLimit && (
        <p className="mt-2 text-xs text-red-400">
          Limite atteinte pour cette période. Passez à un plan supérieur pour continuer.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p className="mt-2 text-xs text-amber-400">
          Vous approchez de votre limite. Pensez à passer à un plan supérieur.
        </p>
      )}
    </div>
  );
}
