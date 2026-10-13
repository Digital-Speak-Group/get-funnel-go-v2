import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingPlans } from "../_lib/plans";
import { marketingMessages } from "../messages";
import { Section, SectionHeading } from "./Section";

const m = marketingMessages.pricingTeaser;

export function PricingTeaser() {
  return (
    <Section id="pricing" aria-labelledby="pricing-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <SectionHeading id="pricing-title" kicker={m.kicker} title={m.title} lead={m.lead} />
        <Button asChild variant="outline" className="self-start md:self-auto">
          <Link href="/pricing">
            {m.cta}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
        {marketingPlans.map((plan) => (
          <li key={plan.key} className="bg-background p-6">
            <h3 className="text-h3 text-foreground">{plan.name}</h3>
            <p className="mt-3 font-mono text-2xl font-medium tabular-nums tracking-tight text-foreground">
              {plan.priceLabel}
            </p>
            <p className="mt-1 text-small text-muted-foreground">{m.credits(plan.credits)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
