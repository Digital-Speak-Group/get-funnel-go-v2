"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { useNearViewport } from "./use-near-viewport";

/**
 * The slide renderer (and its registry of every slide type) is a client-only chunk, fetched
 * after hydration and only for frames close to the viewport, so it never weighs on first paint.
 */
const AutoScaledSlideRenderer = dynamic(
  () => import("@/components/slides/SlideRenderer").then((m) => m.AutoScaledSlideRenderer),
  { ssr: false, loading: () => null }
);

const HeroPreview = dynamic(() => import("./HeroPreview").then((m) => m.HeroPreview), {
  ssr: false,
  loading: () => <SlideFramePlaceholder withCaption />,
});

interface LazySlideProps {
  slide: Slide;
  theme: ThemeTokens;
  className?: string;
}

/** A 16:9 frame that renders a real slide once it nears the viewport. */
export function LazySlide({ slide, theme, className }: LazySlideProps) {
  const [ref, near] = useNearViewport<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("aspect-video w-full overflow-hidden bg-surface-2", className)}>
      {near && <AutoScaledSlideRenderer slide={slide} theme={theme} staticPreview />}
    </div>
  );
}

/** Same footprint as the hero preview, shown while its chunk loads (no layout shift). */
export function SlideFramePlaceholder({ withCaption = false }: { withCaption?: boolean }) {
  return (
    <div aria-hidden="true">
      <div className="aspect-video w-full rounded-lg border border-border-strong bg-surface-2" />
      {withCaption && <div className="h-11" />}
    </div>
  );
}

/**
 * The hero preview starts once the browser is idle after the first paint: the renderer chunk
 * (every slide type) and its layout would otherwise compete with the page becoming
 * interactive. The placeholder keeps the exact footprint meanwhile.
 */
export function LazyHeroPreview(props: React.ComponentProps<typeof HeroPreview>) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(id);
  }, []);
  return ready ? <HeroPreview {...props} /> : <SlideFramePlaceholder withCaption />;
}
