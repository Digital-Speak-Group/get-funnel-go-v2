"use client";

import * as React from "react";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { AutoScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import { LiveBlanksProvider } from "@/components/slides/render-context";
import { Kbd } from "@/components/app/patterns/Kbd";
import { usePresenterSync } from "@/hooks/useSyncedSlide";
import { PresenterTopBar } from "./PresenterTopBar";
import { PresenterPanel } from "./PresenterPanel";
import { usePresenterClock } from "./usePresenterClock";
import { usePresenterKeys } from "./usePresenterKeys";
import { PRESENTER_MESSAGES as m } from "./messages";
import { RevealProvider } from "@/components/slides/reveal-context";
import { revealSteps, revealedUpTo } from "@/lib/slides/reveal";
import { navigate, type PresenterMove, type PresenterPosition } from "./navigation";

interface PresenterShellProps {
  deck: { id: string; title: string; presentToken: string };
  slides: Slide[];
  theme: ThemeTokens;
}

/**
 * Presenter view (Task 47): current slide large, next slide preview, timer, audience link
 * state, Script / Notes / Métriques. Animation-free by design (docs/design-system.md → Motion).
 */
export function PresenterShell({ deck, slides, theme }: PresenterShellProps) {
  // Slide and build step (Task 75): "next" reveals a slide's steps before moving on.
  const [position, setPosition] = React.useState<PresenterPosition>({ index: 0, step: 0 });
  const { index, step } = position;
  const stepsOf = React.useCallback((i: number) => (slides[i] ? revealSteps(slides[i]) : []), [slides]);
  const move = React.useCallback(
    (to: PresenterMove) => setPosition((p) => navigate(p, to, slides.length, (i) => stepsOf(i).length)),
    [slides.length, stepsOf]
  );
  const goTo = React.useCallback((i: number) => move({ goTo: i }), [move]);
  const clock = usePresenterClock(slides.length, index);
  const { isFullscreen, toggleFullscreen } = usePresenterKeys({
    next: () => move("next"),
    previous: () => move("previous"),
    first: () => move("first"),
    last: () => move("last"),
    toggleTimer: clock.toggle,
  });

  // Live values of blanks slides, by slide id: in memory only, broadcast with each sync event.
  const [blankValues, setBlankValues] = React.useState<Record<string, string[]>>({});
  const current = slides[index];
  const next = slides[index + 1] ?? null;
  const currentBlanks = current?.type === "blanks" ? { slideId: current.id, values: blankValues[current.id] ?? [] } : undefined;
  const link = usePresenterSync(deck.presentToken, index, true, currentBlanks, step);
  const steps = stepsOf(index);

  if (!current) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <main className="flex min-w-0 flex-1 flex-col">
        <PresenterTopBar
          title={deck.title}
          presentToken={deck.presentToken}
          index={index}
          total={slides.length}
          onPrevious={() => move("previous")}
          onNext={() => move("next")}
          steps={steps.length > 0 ? { current: step, total: steps.length } : null}
          link={link}
          timer={clock}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
        <div className="h-0.5 shrink-0 bg-surface-3" aria-hidden="true">
          <div className="h-full bg-primary" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
        </div>

        <div className="min-h-0 flex-1 p-4">
          {/* Not `isActive`: the presenter view stays animation-free. */}
          <LiveBlanksProvider values={blankValues}>
            {/* Not-yet-revealed elements show ghosted: the presenter sees what comes next. */}
            <RevealProvider value={{ upTo: revealedUpTo(steps, step), mode: "presenter" }}>
              <AutoScaledSlideRenderer slide={current} theme={theme} className="rounded-lg border border-border" />
            </RevealProvider>
          </LiveBlanksProvider>
        </div>

        <div className="flex shrink-0 items-end gap-4 px-4 pb-3">
          {next ? (
            <div className="h-28 w-52 shrink-0">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">{m.next}</p>
              <div
                className="group h-[calc(100%-1.25rem)] cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => goTo(index + 1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && goTo(index + 1)}
                aria-label={m.goNext}
              >
                <AutoScaledSlideRenderer slide={next} theme={theme} staticPreview className="rounded-md border border-border group-hover:border-border-strong" />
              </div>
            </div>
          ) : (
            <div className="w-52 shrink-0" />
          )}
          <p className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint" aria-label={m.keys.label}>
            <span className="flex items-center gap-1"><Kbd>←</Kbd><Kbd>→</Kbd> {m.keys.navigate}</span>
            <span className="flex items-center gap-1"><Kbd>P</Kbd> {m.keys.timer}</span>
            <span className="flex items-center gap-1"><Kbd>F</Kbd> {m.keys.fullscreen}</span>
          </p>
        </div>
      </main>

      <PresenterPanel
        slides={slides}
        theme={theme}
        index={index}
        onGoTo={goTo}
        slideSeconds={clock.slideSeconds}
        elapsedSec={clock.totalSeconds}
        blankValues={blankValues}
        onBlankValues={(slideId, values) => setBlankValues((prev) => ({ ...prev, [slideId]: values }))}
      />
    </div>
  );
}
