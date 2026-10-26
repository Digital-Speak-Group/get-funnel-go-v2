import * as React from "react";
import { cn } from "@/lib/utils";

/** Page-width container shared by the marketing header, sections and footer. */
export const containerClass = "mx-auto w-full max-w-6xl px-4 md:px-8";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Separate from the previous section with a hairline. */
  divided?: boolean;
}

export function Section({ divided = true, className, children, ...props }: SectionProps) {
  return (
    <section className={cn(divided && "border-t border-border", "scroll-mt-16", className)} {...props}>
      <div className={cn(containerClass, "py-20 md:py-28")}>{children}</div>
    </section>
  );
}

interface SectionHeadingProps {
  id?: string;
  kicker: string;
  title: string;
  lead?: string;
  className?: string;
}

/** Kicker, title and lead of a section; `id` names the heading for `aria-labelledby`. */
export function SectionHeading({ id, kicker, title, lead, className }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <p className="text-label-caps text-faint">{kicker}</p>
      <h2 id={id} className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{lead}</p>}
    </div>
  );
}
