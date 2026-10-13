"use client";

import * as React from "react";

/**
 * The presenter's clock: total elapsed seconds (start/pause/reset) and the seconds spent on
 * each slide while it runs (Métriques tab).
 */
export function usePresenterClock(slideCount: number, currentIndex: number) {
  const [totalSeconds, setTotalSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [slideSeconds, setSlideSeconds] = React.useState<number[]>(() => Array(slideCount).fill(0));
  const indexRef = React.useRef(currentIndex);
  indexRef.current = currentIndex;

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTotalSeconds((s) => s + 1);
      setSlideSeconds((prev) => {
        const next = [...prev];
        next[indexRef.current] = (next[indexRef.current] ?? 0) + 1;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const start = React.useCallback(() => setRunning(true), []);
  const pause = React.useCallback(() => setRunning(false), []);
  const toggle = React.useCallback(() => setRunning((r) => !r), []);
  const reset = React.useCallback(() => {
    setRunning(false);
    setTotalSeconds(0);
  }, []);

  return { totalSeconds, running, slideSeconds, start, pause, toggle, reset };
}
