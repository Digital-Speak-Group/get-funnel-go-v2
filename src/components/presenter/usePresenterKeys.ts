"use client";

import * as React from "react";

interface PresenterKeyActions {
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
  toggleTimer: () => void;
}

/**
 * Presenter keyboard map (unchanged): → ↓ Space next, ← ↑ previous, Home/End, F fullscreen,
 * P timer, Escape leaves fullscreen. Ignored while typing (blanks inputs). Returns the
 * fullscreen state and its toggle.
 */
export function usePresenterKeys(actions: PresenterKeyActions) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const actionsRef = React.useRef(actions);
  actionsRef.current = actions;

  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  React.useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const a = actionsRef.current;
      const keys: Record<string, () => void> = {
        ArrowRight: a.next,
        ArrowDown: a.next,
        " ": a.next,
        ArrowLeft: a.previous,
        ArrowUp: a.previous,
        Home: a.first,
        End: a.last,
        f: toggleFullscreen,
        F: toggleFullscreen,
        p: a.toggleTimer,
        P: a.toggleTimer,
      };
      const action = keys[e.key];
      if (action) {
        e.preventDefault();
        action();
      } else if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  return { isFullscreen, toggleFullscreen };
}
