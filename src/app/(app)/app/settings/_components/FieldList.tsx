import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only settings fields: label column left, value right, hairline dividers. */
export function FieldList({ className, ...props }: React.HTMLAttributes<HTMLDListElement>) {
  return <dl className={cn("-my-3 divide-y divide-border", className)} {...props} />;
}

interface FieldRowProps {
  icon: LucideIcon;
  label: React.ReactNode;
  children: React.ReactNode;
  /** Monospace value (identifiers, slugs). */
  mono?: boolean;
}

export function FieldRow({ icon: Icon, label, children, mono = false }: FieldRowProps) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="flex items-center gap-2 text-small text-muted-foreground">
        <Icon className="size-4 shrink-0 text-faint" aria-hidden="true" />
        {label}
      </dt>
      <dd className={cn("truncate text-sm text-foreground", mono && "font-mono text-small")}>{children}</dd>
    </div>
  );
}
