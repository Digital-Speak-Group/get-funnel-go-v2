"use client";

import * as React from "react";
import { Pause, Play } from "lucide-react";
import { AutoScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketingMessages } from "../messages";
import { usePrefersReducedMotion } from "./use-near-viewport";

const m = marketingMessages.preview;
const ADVANCE_MS = 4000;

interface HeroPreviewProps {
  slides: Slide[];
  theme: ThemeTokens;
  templateName: string;
}

/**
 * Live preview of a real template: the slide renderer walks through its slides on a timer.
 * No auto-advance under prefers-reduced-motion; hover, focus or the pause button stop it.
 */
export function HeroPreview({ slides, theme, templateName }: HeroPreviewProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const autoplay = !reducedMotion && !paused && !held && slides.length > 1;

  React.useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [autoplay, slides.length]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <figure
      aria-roledescription="carrousel"
      aria-label={m.label(templateName)}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
      }}
    >
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border-strong bg-surface-2 shadow-pop">
        <AutoScaledSlideRenderer slide={slide} theme={theme} staticPreview />
      </div>
      <figcaption className="flex h-11 items-end justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 pb-1.5 text-small text-muted-foreground">
          <span className="truncate">{m.caption(templateName, theme.name)}</span>
          <span className="font-mono tabular-nums text-faint">{m.counter(index + 1, slides.length)}</span>
        </span>
        <span className="flex shrink-0 items-center">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={m.goTo(i + 1)}
              aria-current={i === index ? "true" : undefined}
              className="group hidden size-8 place-items-center rounded-md sm:grid"
            >
              <span
                className={cn(
                  "h-1 w-4 rounded-full transition-colors duration-150",
                  i === index ? "bg-foreground" : "bg-faint/40 group-hover:bg-faint"
                )}
              />
            </button>
          ))}
          {!reducedMotion && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? m.play : m.pause}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </Button>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
