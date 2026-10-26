import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { billingMessages as m } from "./messages";

const barVariants = cva("h-full rounded-full transition-[width] duration-500 ease-out", {
  variants: {
    level: { ok: "bg-primary", near: "bg-warning", at: "bg-danger" },
  },
});

const valueVariants = cva("font-mono text-sm tabular-nums", {
  variants: {
    level: { ok: "text-foreground", near: "text-warning", at: "text-danger" },
  },
});

interface UsageMeterProps {
  used: number;
  limit: number;
  label: string;
  className?: string;
}

/** Usage against a plan limit: amber from 80 %, red at the limit. */
export function UsageMeter({ used, limit, label, className }: UsageMeterProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const level = percentage >= 100 ? "at" : percentage >= 80 ? "near" : "ok";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-small text-muted-foreground">{label}</span>
        <span className={valueVariants({ level })}>
          {used} <span className="text-faint">/ {limit}</span>
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
      >
        <div className={barVariants({ level })} style={{ width: `${percentage}%` }} />
      </div>

      {level === "at" && <p className="text-xs text-danger">{m.usage.atLimit}</p>}
      {level === "near" && <p className="text-xs text-warning">{m.usage.nearLimit}</p>}
    </div>
  );
}
