import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { onboardingMessages as m } from "./messages";

interface OnboardingStepperProps {
  /** Zero-based index of the current step. */
  current: number;
}

/** Step list + progress bar. Completed steps are checked, the current one is announced. */
export function OnboardingStepper({ current }: OnboardingStepperProps) {
  const total = m.steps.length;
  const percent = Math.round(((current + 1) / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-label-caps text-faint" aria-live="polite">
          {m.progress(current + 1, total)}
        </p>
        <span className="font-mono text-small tabular-nums text-faint">{percent} %</span>
      </div>

      <div
        role="progressbar"
        aria-label={m.progressLabel}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={m.progress(current + 1, total)}
        className="h-1 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="grid grid-cols-3 gap-2">
        {m.steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={step.label}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 text-small",
                active ? "text-foreground" : done ? "text-muted-foreground" : "text-faint"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-xs tabular-nums",
                  done && "border-primary/30 bg-primary/15 text-brand",
                  active && "border-primary text-foreground",
                  !done && !active && "border-border-strong"
                )}
              >
                {done ? <Check className="size-3" aria-hidden="true" /> : i + 1}
              </span>
              <span className="truncate">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
