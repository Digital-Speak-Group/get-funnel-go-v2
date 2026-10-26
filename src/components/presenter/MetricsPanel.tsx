import * as React from "react";
import type { Slide } from "@/lib/slides/schema";
import { cn } from "@/lib/utils";
import { computePace, formatTime, type PaceStatus } from "./pace";
import { PRESENTER_MESSAGES } from "./messages";

const m = PRESENTER_MESSAGES.pace;

const STATUS_CLASSES: Record<PaceStatus, string> = {
  "on-track": "border-success/40 bg-success/10 text-success",
  ahead: "border-primary/40 bg-primary/10 text-brand",
  behind: "border-warning/40 bg-warning/10 text-warning",
};

interface MetricsPanelProps {
  /** Seconds spent on each slide, by index. */
  slideSeconds: number[];
  slides: Slide[];
  currentIndex: number;
  elapsedSec: number;
}

/** Stats tab: elapsed vs the deck's target duration, then time per slide vs its own target. */
export function MetricsPanel({ slideSeconds, slides, currentIndex, elapsedSec }: MetricsPanelProps) {
  const pace = computePace(slides, currentIndex, elapsedSec);
  const spentTotal = slideSeconds.reduce((sum, s) => sum + s, 0);

  return (
    <div className="space-y-4" data-testid="presenter-metrics">
      <div className="space-y-2 rounded-lg bg-muted px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{m.elapsed}</span>
          <span className="font-mono text-sm tabular-nums text-foreground">
            {formatTime(elapsedSec)}
            {pace && <span className="text-faint"> / {formatTime(pace.targetSec)}</span>}
          </span>
        </div>
        {pace ? (
          <>
            <p
              className={cn("rounded-md border px-2 py-1 text-center text-xs font-medium", STATUS_CLASSES[pace.status])}
              data-testid="presenter-pace"
              data-status={pace.status}
            >
              {pace.status === "on-track"
                ? m.onTrack
                : pace.status === "ahead"
                  ? m.ahead(formatTime(pace.deltaSec))
                  : m.behind(formatTime(pace.deltaSec))}
            </p>
            {pace.untimedSlides > 0 && <p className="text-xs text-faint">{m.untimed(pace.untimedSlides)}</p>}
          </>
        ) : (
          <p className="text-xs text-faint">{m.noTarget}</p>
        )}
      </div>

      <div className="space-y-1.5">
        {slides.map((slide, i) => {
          const spent = slideSeconds[i] ?? 0;
          const target = slide.cue?.durationSec;
          const over = target !== undefined && spent > target;
          // Bar shows progress against the slide's own target, or its share of the time so far.
          const pct = target ? Math.min(100, (spent / target) * 100) : spentTotal > 0 ? (spent / spentTotal) * 100 : 0;
          return (
            <div key={slide.id} className={cn("rounded px-3 py-2", i === currentIndex && "bg-muted")}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className={cn("truncate text-xs", i === currentIndex ? "text-foreground" : "text-muted-foreground")}>
                  {i + 1}. {slide.cue?.tag ?? slide.type}
                </span>
                <span className={cn("font-mono text-xs tabular-nums", over ? "text-warning" : "text-muted-foreground")}>
                  {formatTime(spent)}
                  {target !== undefined && <span className="text-faint"> / {formatTime(target)}</span>}
                </span>
              </div>
              {(spent > 0 || target !== undefined) && (
                <div className="h-0.5 overflow-hidden rounded-full bg-accent">
                  <div
                    className={cn("h-full rounded-full", over ? "bg-warning" : "bg-primary")}
                    style={{ width: `${pct}%` }}
                    title={over ? m.overBudget : undefined}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
