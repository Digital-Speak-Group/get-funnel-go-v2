"use client";

import * as React from "react";
import { toast } from "sonner";
import type { FreeElement } from "@/lib/slides/free";
import { FREE_MESSAGES as m } from "../messages";
import { copyToClipboard, hasClipboard, readClipboard } from "./clipboard";
import {
  alignElements,
  duplicateElements,
  nudgeElements,
  removeElements,
  reorderElements,
  type Alignment,
} from "./free-ops";
import {
  distributeElements,
  expandToGroups,
  groupElements,
  pasteElements,
  setLocked,
  ungroupElements,
  unlockedIds,
} from "./selection-ops";

/** A change to the slide's elements; changes of the same `group` close together are one undo step. */
export type FreeCommit = (elements: FreeElement[], group?: string) => void;

interface FreeActionsOptions {
  slideId: string;
  elementsRef: React.RefObject<FreeElement[]>;
  selected: string[];
  setSelected: (ids: string[]) => void;
  commit: FreeCommit;
}

/**
 * Everything the freeform toolbar, right-click menu and shortcuts can do to the selection
 * (Task 70), in one place so the three always agree. Locked elements are skipped by the
 * actions that move or delete.
 */
export function useFreeActions({ slideId, elementsRef, selected, setSelected, commit }: FreeActionsOptions) {
  const all = () => elementsRef.current ?? [];
  const movable = () => unlockedIds(all(), selected);

  function remove() {
    const ids = movable();
    if (ids.length === 0) return void (selected.length > 0 && toast(m.lockedHint));
    commit(removeElements(all(), ids));
    setSelected(selected.filter((id) => !ids.includes(id)));
  }

  function copy() {
    const picked = all().filter((e) => selected.includes(e.id));
    if (picked.length > 0) copyToClipboard(picked, slideId);
  }

  function paste() {
    const clip = readClipboard(slideId);
    if (!clip) return;
    const result = pasteElements(all(), clip.elements, clip.offset);
    if (!result) return void toast.error(m.limit);
    commit(result.elements);
    setSelected(result.ids);
  }

  function duplicate() {
    const result = duplicateElements(all(), selected);
    if (!result) return void (selected.length > 0 && toast.error(m.limit));
    commit(result.elements);
    setSelected(result.ids);
  }

  const lockedAll = selected.length > 0 && all().filter((e) => selected.includes(e.id)).every((e) => e.locked);
  const grouped = all().some((e) => selected.includes(e.id) && e.groupId);

  return {
    hasSelection: selected.length > 0,
    canPaste: hasClipboard,
    lockedAll,
    grouped,
    canGroup: selected.length >= 2,
    canDistribute: unlockedIds(all(), selected).length >= 3,
    remove,
    copy,
    cut() {
      copy();
      remove();
    },
    paste,
    duplicate,
    selectAll: () => setSelected(all().map((e) => e.id)),
    group() {
      const next = groupElements(all(), selected);
      if (next) commit(next);
    },
    ungroup() {
      const next = ungroupElements(all(), selected);
      if (next) commit(next);
    },
    toggleLock: () => commit(setLocked(all(), selected, !lockedAll)),
    arrange: (move: "forward" | "backward" | "front" | "back") => commit(reorderElements(all(), selected, move)),
    align: (to: Alignment) => commit(alignElements(all(), movable(), to)),
    distribute(axis: "horizontal" | "vertical") {
      const next = distributeElements(all(), selected, axis);
      if (next) commit(next);
    },
    // Held arrow keys are one undo step.
    nudge: (dx: number, dy: number) => commit(nudgeElements(all(), movable(), dx, dy), `nudge:${selected.join()}`),
    /** Selects an element with the rest of its group. */
    select: (ids: string[]) => setSelected(expandToGroups(all(), ids)),
  };
}

export type FreeActions = ReturnType<typeof useFreeActions>;
