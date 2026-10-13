"use client";

import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import type { Slide } from "@/lib/slides/schema";
import { defaultTheme, systemThemes } from "@/lib/slides/theme";
import { authMessages } from "../messages";

const m = authMessages.showcase;

/** Static sample slide — real product rendering, no DB call. */
const SHOWCASE_SLIDE: Slide = {
  id: "00000000-0000-4000-8000-0000000000a1",
  position: 0,
  type: "cover",
  content: {
    kicker: m.slide.kicker,
    title: m.slide.title,
    subtitle: m.slide.subtitle,
    presenterName: m.slide.presenterName,
  },
};

const SHOWCASE_THEME = systemThemes.find((theme) => theme.id === "signature-violet") ?? defaultTheme;

/** Right panel of the auth split screen: a live-rendered deck slide. Hidden below `lg`. */
export function AuthShowcase() {
  return (
    <aside className="hidden flex-col justify-center gap-10 border-l border-border bg-surface px-12 py-16 lg:flex xl:px-20">
      <div className="space-y-3">
        <p className="text-label-caps text-faint">{m.kicker}</p>
        <h2 className="max-w-md text-h1 text-foreground">{m.title}</h2>
        <p className="max-w-md text-body text-muted-foreground">{m.description}</p>
      </div>

      <figure className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-lg border border-border-strong shadow-pop">
          <SlideThumbnail slide={SHOWCASE_SLIDE} theme={SHOWCASE_THEME} className="aspect-video w-full" />
        </div>
        <figcaption className="sr-only">{m.slideLabel}</figcaption>
      </figure>

      <ul className="grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-6">
        {m.facts.map((fact) => (
          <li key={fact.label} className="space-y-1">
            <p className="font-mono text-h2 tabular-nums text-foreground">{fact.value}</p>
            <p className="text-small text-muted-foreground">{fact.label}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
