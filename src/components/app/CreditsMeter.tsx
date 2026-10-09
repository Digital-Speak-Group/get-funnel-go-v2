import Link from "next/link";
import { cn } from "@/lib/utils";
import { shellMessages as m } from "./messages";

interface CreditsMeterProps {
  used: number;
  limit: number;
}

export function CreditsMeter({ used, limit }: CreditsMeterProps) {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const atLimit = ratio >= 1;
  const nearLimit = !atLimit && ratio >= 0.8;

  return (
    <Link
      href="/app/settings/billing"
      className="group block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring outline-none"
      aria-label={`${m.credits.title} : ${used} / ${limit}. ${m.credits.manage}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-small text-muted-foreground">{m.credits.title}</span>
        <span className="text-xs text-faint transition-colors group-hover:text-brand">{m.credits.manageShort}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
        <span className="text-sm font-medium text-foreground">{used}</span>
        <span className="text-xs text-faint">/ {limit}</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            atLimit ? "bg-danger" : nearLimit ? "bg-warning" : "bg-primary"
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {(atLimit || nearLimit) && (
        <p className={cn("mt-2 text-xs", atLimit ? "text-danger" : "text-warning")}>
          {atLimit ? m.credits.atLimit : m.credits.nearLimit}
        </p>
      )}
    </Link>
  );
}
