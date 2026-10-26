import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingMessages } from "../messages";
import { Section } from "./Section";

const m = marketingMessages.finalCta;

export function FinalCta() {
  return (
    <Section aria-labelledby="final-cta-title">
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 id="final-cta-title" className="text-2xl font-semibold tracking-tight text-foreground md:text-4xl">
            {m.title}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">{m.lead}</p>
        </div>
        <Button asChild size="xl" className="shrink-0">
          <Link href="/signup">
            {m.primary}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
