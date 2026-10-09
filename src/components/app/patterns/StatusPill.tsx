import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-xs font-medium",
  {
    variants: {
      status: {
        idle: "text-faint",
        saved: "text-muted-foreground",
        saving: "text-muted-foreground",
        error: "bg-danger/10 text-danger",
        live: "bg-success/10 text-success",
      },
    },
    defaultVariants: { status: "idle" },
  }
);

const dotVariants = cva("size-1.5 rounded-full", {
  variants: {
    status: {
      idle: "bg-faint",
      saved: "bg-success",
      saving: "animate-pulse bg-warning",
      error: "bg-danger",
      live: "bg-success",
    },
  },
  defaultVariants: { status: "idle" },
});

interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {}

/** Announces state changes politely (save status, connection status). */
export function StatusPill({ status, className, children, ...props }: StatusPillProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(statusPillVariants({ status }), className)}
      {...props}
    >
      <span className={dotVariants({ status })} aria-hidden="true" />
      {children}
    </span>
  );
}
