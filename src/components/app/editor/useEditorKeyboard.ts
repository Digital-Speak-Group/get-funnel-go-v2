"use client";

import * as React from "react";

/** True while the user types in a field (form input, text on the canvas): native undo applies there. */
export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** Editor-wide shortcuts (Task 69): Ctrl+Z undo, Ctrl+Shift+Z / Ctrl+Y redo. */
export function useEditorKeyboard({ undo, redo }: { undo: () => void; redo: () => void }) {
  const latest = React.useRef({ undo, redo });
  latest.current = { undo, redo };

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) latest.current.redo();
        else latest.current.undo();
      } else if (key === "y") {
        event.preventDefault();
        latest.current.redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
