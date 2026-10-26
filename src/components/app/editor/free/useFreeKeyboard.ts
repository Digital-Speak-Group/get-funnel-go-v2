"use client";

import * as React from "react";
import { isTyping } from "../useEditorKeyboard";
import type { FreeActions } from "./useFreeActions";

/**
 * Freeform shortcuts, ignored while typing: Ctrl+V and Ctrl+A anytime; on the selection
 * Delete/Backspace, Escape, Ctrl+C/X/D, Ctrl+G (Shift: ungroup), arrows (Shift = 10 px).
 * Undo/redo is editor-wide (useEditorKeyboard).
 */
export function useFreeKeyboard(actions: FreeActions, clearSelection: () => void) {
  const latest = React.useRef({ actions, clearSelection });
  latest.current = { actions, clearSelection };

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) return;
      const { actions: a, clearSelection: clear } = latest.current;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      const run = (fn: () => void) => {
        event.preventDefault();
        fn();
      };

      if (mod && key === "v") return run(a.paste);
      if (mod && key === "a") return run(a.selectAll);
      if (!a.hasSelection) return;

      if (event.key === "Delete" || event.key === "Backspace") run(a.remove);
      else if (event.key === "Escape") clear();
      else if (mod && key === "c") run(a.copy);
      else if (mod && key === "x") run(a.cut);
      else if (mod && key === "d") run(a.duplicate);
      else if (mod && key === "g") run(event.shiftKey ? a.ungroup : a.group);
      else if (event.key.startsWith("Arrow")) {
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        run(() => a.nudge(dx, dy));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
