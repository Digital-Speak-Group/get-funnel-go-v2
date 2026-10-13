import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FaqItem } from "../messages";

/** Native disclosure list: keyboard and screen-reader friendly, no client JavaScript. */
export function FaqList({ items, className }: { items: FaqItem[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-border border-y border-border", className)}>
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium text-foreground transition-colors duration-150 hover:text-muted-foreground [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="size-4 shrink-0 text-faint transition-transform duration-150 group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <p className="max-w-2xl pb-5 text-small leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
