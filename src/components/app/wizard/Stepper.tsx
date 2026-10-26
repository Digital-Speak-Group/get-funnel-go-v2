import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_MESSAGES as m } from "./messages";

/** Three-step progress header: done steps can be revisited, later ones can't be skipped to. */
export function Stepper({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  return (
    <ol className="flex items-center gap-2" aria-label={m.title}>
      {m.steps.map((name, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={name} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!done}
              onClick={() => onSelect(index)}
              aria-current={active ? "step" : undefined}
              aria-label={m.stepLabel(index + 1, m.steps.length, name)}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-md text-small outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "text-foreground" : done ? "text-muted-foreground hover:text-foreground" : "text-faint"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs tabular-nums",
                  active && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary/40 bg-primary/15 text-brand",
                  !active && !done && "border-border-strong"
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className="truncate">{name}</span>
            </button>
            {index < m.steps.length - 1 && <span className={cn("h-px flex-1", done ? "bg-primary/40" : "bg-border")} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
