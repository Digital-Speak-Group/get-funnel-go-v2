"use client";

import { SlideRenderer } from "@/components/slides/SlideRenderer";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";

const SCALE = 0.5;

export function SlidePreviewGrid({ slides, theme }: { slides: Slide[]; theme: ThemeTokens }) {
  return (
    <main className="min-h-screen bg-background p-6">
      <p className="mb-4 text-small text-muted-foreground">
        {theme.name} · {slides.length} slides
      </p>
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(auto-fill, ${1920 * SCALE}px)` }}>
        {slides.map((slide) => (
          <figure
            key={slide.id}
            data-testid="dev-slide"
            style={{ width: 1920 * SCALE, height: 1080 * SCALE, overflow: "hidden", position: "relative" }}
          >
            <div style={{ transform: `scale(${SCALE})`, transformOrigin: "top left", width: 1920, height: 1080 }}>
              <SlideRenderer slide={slide} theme={theme} />
            </div>
            {slide.layout && (
              <figcaption className="absolute left-2 top-2 rounded bg-background px-2 py-0.5 font-mono text-xs text-foreground">
                {slide.type} · {slide.layout}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </main>
  );
}
