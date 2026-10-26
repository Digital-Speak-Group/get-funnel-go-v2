import * as React from "react";
import { cn } from "@/lib/utils";

/** Funnel mark: three bars narrowing to a point, on the primary tile. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-highlight",
        className
      )}
    >
      <svg viewBox="0 0 16 16" className="size-[62%]" fill="currentColor">
        <rect x="1" y="2" width="14" height="3" rx="1.5" />
        <rect x="3.5" y="6.5" width="9" height="3" rx="1.5" opacity="0.85" />
        <rect x="6" y="11" width="4" height="3" rx="1.5" opacity="0.7" />
      </svg>
    </span>
  );
}

interface LogoProps {
  className?: string;
  /** Hide the wordmark (collapsed sidebar). */
  markOnly?: boolean;
}

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      {markOnly ? (
        <span className="sr-only">GetFunnels</span>
      ) : (
        <span className="text-[0.9375rem] font-semibold tracking-tight text-foreground">GetFunnels</span>
      )}
    </span>
  );
}
