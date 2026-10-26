import { cn } from "@/lib/utils";
import { marketingFacts as facts } from "../_lib/facts";
import { marketingMessages } from "../messages";
import { containerClass } from "./Section";

const m = marketingMessages.facts;

/** Countable facts only: each value is derived from the code in `_lib/facts.ts`. */
const ITEMS = [
  { value: String(facts.frameworks), label: m.frameworks },
  { value: String(facts.slideTypes), label: m.slideTypes },
  { value: String(facts.themes), label: m.themes },
  { value: `${facts.minSlides}–${facts.maxSlides}`, label: m.slideRange },
];

export function Facts() {
  return (
    <section aria-label={m.label} className="border-y border-border bg-surface">
      <dl className={cn(containerClass, "grid grid-cols-2 md:grid-cols-4")}>
        {ITEMS.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              // 2×2 grid on mobile, one row from md: hairlines between cells, never around.
              "flex flex-col gap-1 border-border py-8 md:px-8",
              i % 2 === 1 && "border-l pl-6",
              i >= 2 && "border-t md:border-t-0",
              i === 2 && "md:border-l",
              i === 0 && "md:pl-0"
            )}
          >
            <dt className="order-2 text-small text-muted-foreground">{item.label}</dt>
            <dd className="order-1 font-mono text-3xl font-medium tabular-nums tracking-tight text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
