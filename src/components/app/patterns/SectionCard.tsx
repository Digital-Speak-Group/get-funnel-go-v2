import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Footer actions, right-aligned (e.g. a save button). */
  footer?: React.ReactNode;
  /** Optional note shown left in the footer. */
  footerNote?: React.ReactNode;
  tone?: "default" | "danger";
}

/** A settings-style form section: title + description, body, and an action footer. */
export function SectionCard({
  title,
  description,
  footer,
  footerNote,
  tone = "default",
  className,
  children,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border bg-surface",
        tone === "danger" ? "border-danger/30" : "border-border",
        className
      )}
      {...props}
    >
      <div className="space-y-1 p-5 pb-0">
        <h2 className="text-h3 text-foreground">{title}</h2>
        {description && <p className="text-small text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
      {(footer || footerNote) && (
        <div className="flex flex-col gap-3 border-t border-border bg-surface-2/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-small text-faint">{footerNote}</div>
          <div className="flex items-center gap-2">{footer}</div>
        </div>
      )}
    </section>
  );
}
