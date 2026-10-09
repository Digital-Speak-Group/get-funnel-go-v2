import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** `compact` for inline "no results" states inside a panel. */
  size?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  size = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        size === "default" && "rounded-xl border border-dashed border-border-strong px-6 py-16",
        size === "compact" && "px-4 py-10",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border-strong bg-surface-2 shadow-highlight">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-h3 text-foreground">{title}</h2>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="mt-6 flex flex-col gap-2 sm:flex-row">{actions}</div>}
    </div>
  );
}
