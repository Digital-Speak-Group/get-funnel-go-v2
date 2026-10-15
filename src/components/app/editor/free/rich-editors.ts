"use client";

import * as React from "react";
import type { Editor } from "@tiptap/core";

/**
 * The TipTap editors of the freeform texts on screen, by content path (\`elements.3\`), so the
 * toolbar can format the selected text (Task 76). Module-level: one editor page at a time.
 */
const editors = new Map<string, Editor>();
const listeners = new Set<() => void>();
let version = 0;

function changed() {
  version++;
  listeners.forEach((l) => l());
}

export function registerRichEditor(path: string, editor: Editor): () => void {
  editors.set(path, editor);
  changed();
  return () => {
    if (editors.get(path) === editor) editors.delete(path);
    changed();
  };
}

/** The editor of the text at \`path\`, kept up to date as editors mount and unmount. */
export function useRichEditor(path: string | null): Editor | null {
  React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
    () => 0
  );
  return path ? (editors.get(path) ?? null) : null;
}

/** Called by a rich text field with its new content (path of the text element). */
export type RichTextChange = (path: string, rich: import("@/lib/slides/rich-text").RichText) => void;
export const RichTextChangeContext = React.createContext<RichTextChange | null>(null);
