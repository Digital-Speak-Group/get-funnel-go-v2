import type { Slide } from "@/lib/slides/schema";

export type PaceStatus = "ahead" | "on-track" | "behind";

export interface Pace {
  /** Sum of the slides' cue durations. */
  targetSec: number;
  /** Slides with no `cue.durationSec`; they count as 0 s in the budget. */
  untimedSlides: number;
  status: PaceStatus;
  /** How far ahead/behind the current slide's time window, in seconds (0 when on track). */
  deltaSec: number;
}

/**
 * Where the talk stands against the deck's target duration. On the current slide, the
 * presenter is on track while the elapsed time sits inside that slide's window (sum of the
 * previous slides' durations → plus this one); before it they are ahead, after it behind.
 * `null` when no slide has a duration, so there is no target to track.
 */
export function computePace(slides: Slide[], currentIndex: number, elapsedSec: number): Pace | null {
  const durations = slides.map((s) => s.cue?.durationSec ?? 0);
  const targetSec = durations.reduce((sum, d) => sum + d, 0);
  if (targetSec === 0) return null;

  const windowStart = durations.slice(0, currentIndex).reduce((sum, d) => sum + d, 0);
  const windowEnd = windowStart + (durations[currentIndex] ?? 0);
  const untimedSlides = durations.filter((d) => d === 0).length;

  if (elapsedSec > windowEnd) {
    return { targetSec, untimedSlides, status: "behind", deltaSec: elapsedSec - windowEnd };
  }
  if (elapsedSec < windowStart) {
    return { targetSec, untimedSlides, status: "ahead", deltaSec: windowStart - elapsedSec };
  }
  return { targetSec, untimedSlides, status: "on-track", deltaSec: 0 };
}

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
