import { FileDown, MousePointerClick, Palette, RefreshCw, Shapes, WandSparkles, type LucideIcon } from "lucide-react";
import { marketingFacts as facts } from "../_lib/facts";
import { marketingMessages } from "../messages";
import { Section, SectionHeading } from "./Section";

const m = marketingMessages.features;

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: WandSparkles,
    title: m.items.generate.title,
    text: m.items.generate.text(facts.scriptMin, facts.scriptMax, facts.minSlides, facts.maxSlides),
  },
  { icon: MousePointerClick, title: m.items.edit.title, text: m.items.edit.text },
  { icon: Shapes, title: m.items.free.title, text: m.items.free.text },
  { icon: RefreshCw, title: m.items.regenerate.title, text: m.items.regenerate.text },
  { icon: FileDown, title: m.items.export.title, text: m.items.export.text },
  { icon: Palette, title: m.items.themes.title, text: m.items.themes.text(facts.themes) },
];

export function Features() {
  return (
    <Section id="features" aria-labelledby="features-title">
      <SectionHeading id="features-title" kicker={m.kicker} title={m.title} lead={m.lead} />
      <ul className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="bg-background p-6">
            <span className="flex size-9 items-center justify-center rounded-md border border-border-strong bg-surface-2 shadow-highlight">
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-h3 text-foreground">{title}</h3>
            <p className="mt-2 text-small leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
