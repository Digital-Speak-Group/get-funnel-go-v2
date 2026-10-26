import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketingFacts } from "../_lib/facts";
import { heroShowcase } from "../_lib/showcase";
import { marketingMessages } from "../messages";
import { LazyHeroPreview } from "./LazySlide";
import { containerClass } from "./Section";

const m = marketingMessages.hero;

export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className={cn(containerClass, "pb-20 pt-16 md:pb-28 md:pt-24")}>
        <div className="max-w-3xl">
          <Badge variant="neutral">{m.kicker(marketingFacts.frameworks)}</Badge>
          <h1
            id="hero-title"
            className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-display"
          >
            {m.titleStart}
            <span className="text-muted-foreground">{m.titleEnd}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{m.lead}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="xl">
              <Link href="/signup">
                {m.primary}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/pricing">{m.secondary}</Link>
            </Button>
          </div>
          <p className="mt-4 text-small text-faint">{m.note}</p>
        </div>

        <div className="mt-14 md:mt-16">
          <LazyHeroPreview
            slides={heroShowcase.slides}
            theme={heroShowcase.theme}
            templateName={heroShowcase.templateName}
          />
        </div>
      </div>
    </section>
  );
}
