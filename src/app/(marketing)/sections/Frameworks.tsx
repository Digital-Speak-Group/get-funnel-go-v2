import { frameworkCards } from "../_lib/showcase";
import { marketingMessages } from "../messages";
import { LazySlide } from "./LazySlide";
import { Section, SectionHeading } from "./Section";

const m = marketingMessages.frameworks;

/** The seven legacy frameworks, each shown by its real cover slide in its own system theme. */
export function Frameworks() {
  return (
    <Section id="frameworks" aria-labelledby="frameworks-title">
      <SectionHeading id="frameworks-title" kicker={m.kicker} title={m.title} lead={m.lead} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {frameworkCards.map((card) => (
          <li key={card.slug} className="overflow-hidden rounded-lg border border-border bg-surface">
            <LazySlide slide={card.cover} theme={card.theme} className="border-b border-border" />
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-h3 text-foreground">{card.name}</h3>
                <span className="shrink-0 font-mono text-xs tabular-nums text-faint">{m.slides(card.slideCount)}</span>
              </div>
              <p className="mt-1 text-small text-muted-foreground">
                {card.category} · {m.themeLabel(card.theme.name)}
              </p>
            </div>
          </li>
        ))}
        <li className="flex flex-col justify-end rounded-lg border border-dashed border-border-strong p-4">
          <p className="text-h3 text-foreground">{m.moreTitle}</p>
          <p className="mt-1 text-small text-muted-foreground">{m.moreText}</p>
        </li>
      </ul>
    </Section>
  );
}
