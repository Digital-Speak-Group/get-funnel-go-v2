"use client";

import * as React from "react";
import type { FreeElement } from "@/lib/slides/free";
import { duplicateElements, nudgeElements, removeElements } from "./free-ops";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

interface FreeKeyboardOptions {
  selected: string[];
  setSelected: (ids: string[]) => void;
  elementsRef: React.RefObject<FreeElement[]>;
  commit: (elements: FreeElement[]) => void;
  undo: () => void;
  redo: () => void;
}

/**
 * Freeform shortcuts, ignored while typing: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, and on the
 * selection Delete/Backspace, Escape, Ctrl+D, arrows (Shift = 10 px).
 */
export function useFreeKeyboard({ selected, setSelected, elementsRef, commit, undo, redo }: FreeKeyboardOptions) {
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const ids = selected;
      const elements = elementsRef.current ?? [];
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (ids.length === 0) {
        return;
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        commit(removeElements(elements, ids));
      } else if (event.key === "Escape") {
        setSelected([]);
      } else if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        const result = duplicateElements(elements, ids);
        if (result) {
          commit(result.elements);
          setSelected(result.ids);
        }
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        commit(nudgeElements(elements, ids, dx, dy));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, setSelected, elementsRef, commit, undo, redo]);
}
