import * as React from "react";
import { cn } from "@/lib/utils";
import { FIELD_MESSAGES as m } from "../messages";

/** Shared look of the inspector's form controls (token classes only). */
export function inputClass(hasError: boolean): string {
  return cn(
    "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-faint outline-none transition-colors duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
    hasError && "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
  );
}

/** DOM id for a content path: `painPoints.0.title` → `field-painPoints-0-title`. */
export const fieldId = (path: string) => `field-${path.replace(/\./g, "-")}`;

export function FieldLabel({ htmlFor, label, optional }: { htmlFor: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-small font-medium text-foreground">
      {label}
      {optional && <span className="font-normal text-faint"> — {m.optional}</span>}
    </label>
  );
}

export function FieldStatus({ path, error, length, max }: { path: string; error?: string[]; length: number; max?: number }) {
  return (
    <div className="flex justify-between gap-2 text-xs">
      <span className="text-danger" data-testid={error ? `slide-error-${path}` : undefined}>
        {error?.[0] ?? ""}
      </span>
      {max !== undefined && (
        <span className={cn("font-mono tabular-nums text-faint", length > max && "text-danger")}>
          {length}/{max}
        </span>
      )}
    </div>
  );
}
