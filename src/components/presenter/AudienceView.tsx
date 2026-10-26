"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type Slide } from "@/lib/slides/schema";
import { type ThemeTokens } from "@/lib/slides/theme";
import { AutoScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import { AudienceAssetUrlProvider } from "@/components/slides/asset-url";
import { LiveBlanksProvider } from "@/components/slides/render-context";
import { RevealProvider } from "@/components/slides/reveal-context";
import { revealSteps, revealedUpTo } from "@/lib/slides/reveal";
import { useAudienceSync } from "@/hooks/useSyncedSlide";
import { AUDIENCE_MESSAGES as m } from "./messages";
import { slideTransitionOf, slideVariants, type TransitionCustom } from "./transitions";

interface AudienceViewProps {
  slides: Slide[];
  theme: ThemeTokens;
  /** Present token — used for realtime sync */
  presentToken: string;
  /** Initial slide index (defaults to 0) */
  initialIndex?: number;
}

const SWIPE_MIN_PX = 50;

/**
 * Audience view (Task 47): full-bleed slide, no chrome. Follows the presenter in realtime;
 * arrows and swipes still work when nobody presents. Each slide arrives with its own
 * transition (Task 74; default cross-fade, 450 ms; opacity only under reduced motion).
 */
export function AudienceView({ slides, theme, presentToken, initialIndex = 0 }: AudienceViewProps) {
  const clamp = React.useCallback((i: number) => Math.max(0, Math.min(slides.length - 1, i)), [slides.length]);
  const [currentIndex, setCurrentIndex] = React.useState(() => clamp(initialIndex));
  // The slide on screen once its transition is over: PDF/PPTX capture waits on it.
  const [settledIndex, setSettledIndex] = React.useState(currentIndex);
  const reduceMotion = useReducedMotion();

  // Values the presenter types into blanks slides (validated in the sync hook).
  const [blankValues, setBlankValues] = React.useState<Record<string, string[]>>({});
  const onBlanks = React.useCallback((slideId: string, values: string[]) => {
    // Heartbeats resend the same values: no new state, no re-render.
    setBlankValues((prev) => (prev[slideId]?.join("\u0000") === values.join("\u0000") ? prev : { ...prev, [slideId]: values }));
  }, []);
  const synced = useAudienceSync(presentToken, true, onBlanks);
  const syncedIndex = synced?.index ?? null;
  React.useEffect(() => {
    if (syncedIndex !== null) setCurrentIndex(clamp(syncedIndex));
  }, [syncedIndex, clamp]);

  // Keyboard (follow along manually).
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
        setCurrentIndex((i) => clamp(i + 1));
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setCurrentIndex((i) => clamp(i - 1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [clamp]);

  // Swipe on touch screens (mobile audience).
  const touchStart = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchStart.current = e.touches[0]?.clientX ?? null);
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    const end = e.changedTouches[0]?.clientX;
    touchStart.current = null;
    if (start === null || end === undefined || Math.abs(end - start) < SWIPE_MIN_PX) return;
    setCurrentIndex((i) => clamp(i + (end < start ? 1 : -1)));
  };

  // Which way we went, for the "slide" transition.
  const previousIndex = React.useRef(currentIndex);
  const direction: 1 | -1 = currentIndex >= previousIndex.current ? 1 : -1;
  React.useEffect(() => {
    previousIndex.current = currentIndex;
  }, [currentIndex]);

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return null;
  // Build steps follow the presenter on the slide they present; anything else shows in full.
  const upTo =
    synced && synced.index === currentIndex && synced.step !== null
      ? revealedUpTo(revealSteps(currentSlide), synced.step)
      : Infinity;
  const custom: TransitionCustom = {
    kind: slideTransitionOf(currentSlide.content),
    direction,
    reduceMotion: !!reduceMotion,
  };

  return (
    <div
      className="relative h-dvh w-screen overflow-hidden bg-background"
      data-slide-index={settledIndex}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Images come through the token route: the audience has no session. */}
      <AudienceAssetUrlProvider presentToken={presentToken}>
        <LiveBlanksProvider values={blankValues}>
          <AnimatePresence initial={false} custom={custom}>
            <motion.div
              key={currentSlide.id}
              className="absolute inset-0"
              custom={custom}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              // Only the incoming slide's arrival counts; the outgoing one also completes (exit).
              onAnimationComplete={(definition) => definition === "center" && setSettledIndex(currentIndex)}
            >
              <RevealProvider value={{ upTo, mode: "audience" }}>
                <AutoScaledSlideRenderer slide={currentSlide} theme={theme} isActive />
              </RevealProvider>
            </motion.div>
          </AnimatePresence>
        </LiveBlanksProvider>
      </AudienceAssetUrlProvider>

      {syncedIndex === null && (
        <p
          data-export-hide
          role="status"
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-foreground"
        >
          {m.waiting}
        </p>
      )}
    </div>
  );
}
