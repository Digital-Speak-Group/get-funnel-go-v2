import { marketingFacts } from "../_lib/facts";
import { landingFaq, marketingMessages } from "../messages";
import { FaqList } from "./Faq";
import { Section, SectionHeading } from "./Section";

const m = marketingMessages.faq;

export function LandingFaq() {
  return (
    <Section id="faq" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-12">
        <SectionHeading id="faq-title" kicker={m.kicker} title={m.title} className="lg:col-span-4" />
        <FaqList items={landingFaq(marketingFacts)} className="lg:col-span-8" />
      </div>
    </Section>
  );
}
