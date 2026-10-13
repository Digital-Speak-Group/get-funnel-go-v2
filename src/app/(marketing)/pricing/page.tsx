import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketingPlans, RECOMMENDED_PLAN } from "../_lib/plans";
import { marketingMessages, pricingFaq } from "../messages";
import { FaqList } from "../sections/Faq";
import { containerClass } from "../sections/Section";
import { PricingPlans } from "./PricingPlans";

const m = marketingMessages.pricing;

export const metadata: Metadata = {
  title: marketingMessages.meta.pricingTitle,
  description: marketingMessages.meta.pricingDescription,
};

export default function PricingPage() {
  return (
    <div className={cn(containerClass, "pb-24 pt-16 md:pt-24")}>
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{m.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{m.lead}</p>
        </div>
        <Button asChild variant="outline" size="lg" className="self-start md:self-auto">
          <Link href="/signup">{m.signup}</Link>
        </Button>
      </header>

      <section aria-label={m.plansLabel} className="mt-12">
        <PricingPlans plans={marketingPlans} recommended={RECOMMENDED_PLAN} />
      </section>

      <section aria-labelledby="credits-title" className="mt-16 grid gap-6 border-t border-border pt-12 lg:grid-cols-12">
        <h2 id="credits-title" className="text-h1 text-foreground lg:col-span-4">
          {m.creditsTitle}
        </h2>
        <div className="space-y-3 text-base leading-relaxed text-muted-foreground lg:col-span-8">
          {m.creditsBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section aria-labelledby="pricing-faq-title" className="mt-16 grid gap-6 border-t border-border pt-12 lg:grid-cols-12">
        <h2 id="pricing-faq-title" className="text-h1 text-foreground lg:col-span-4">
          {marketingMessages.faq.kicker}
        </h2>
        <FaqList items={pricingFaq} className="lg:col-span-8" />
      </section>
    </div>
  );
}
