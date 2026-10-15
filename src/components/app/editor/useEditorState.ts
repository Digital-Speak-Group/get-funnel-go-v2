"use client";

import * as React from "react";
import { SLIDE_TYPES, type SlideType } from "@/lib/slides/schema";
import { validLayout } from "@/lib/slides/layouts";
import type { SlideWithDeck } from "@/lib/db/repositories/slides";
import {
  addSlideAction,
  deleteSlideAction,
  duplicateSlideAction,
  reorderSlidesAction,
  updateSlideAction,
} from "@/app/(app)/app/decks/slides";
import { buildSavePayload, validateEditorSlide, type EditorSlide } from "./validation";
import type { FieldErrors } from "./field-schema";
import { toEditorCue } from "./cue";
import { EditorHistory, changeGroup, snapshotOf, type SlideSnapshot } from "./history";

const AUTOSAVE_DELAY_MS = 800;

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "invalid" | "error";

/**
 * How an edit enters the undo history: `group` merges quick changes of the same group into one
 * step (default: the fields it touches); `false` makes it a step of its own; `record: false`
 * keeps it out (undo/redo themselves).
 */
export interface UpdateOptions {
  group?: string | false;
  record?: boolean;
}

export function toEditorSlide(slide: SlideWithDeck): EditorSlide {
  const validType = (SLIDE_TYPES as readonly string[]).includes(slide.type);
  return {
    id: slide.id,
    position: slide.position,
    type: validType ? (slide.type as SlideType) : "cover",
    content: (slide.content ?? {}) as Record<string, unknown>,
    notes: slide.notes ?? "",
    script: slide.script ?? "",
    cue: toEditorCue(slide.cue),
    layout: validLayout(slide.type, slide.layout),
  };
}

/**
 * The editor's slides: selection, validation, debounced autosave of edited slides, and the
 * slide-list actions (add, move, duplicate, delete). Edits go through `updateActive`, which
 * records an undo step, validates, and only queues a save when the slide is valid.
 */
export function useEditorState(deckId: string, initialSlides: SlideWithDeck[]) {
  const [slides, setSlides] = React.useState<EditorSlide[]>(() => initialSlides.map(toEditorSlide));
  const [activeId, setActiveId] = React.useState<string | null>(initialSlides[0]?.id ?? null);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<SaveStatus>("idle");

  const slidesRef = React.useRef(slides);
  const activeIdRef = React.useRef(activeId);
  const dirtyRef = React.useRef<Set<string>>(new Set());
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = React.useRef(false);
  const lastValidRef = React.useRef<Record<string, EditorSlide>>({});

  function commitSlides(next: EditorSlide[]) {
    slidesRef.current = next;
    setSlides(next);
  }

  React.useEffect(() => {
    for (const slide of slidesRef.current) {
      if (Object.keys(validateEditorSlide(slide)).length === 0) lastValidRef.current[slide.id] = slide;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function flush() {
    if (flushingRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const ids = [...dirtyRef.current];
    if (ids.length === 0) return;

    dirtyRef.current.clear();
    flushingRef.current = true;
    setStatus("saving");
    try {
      for (const id of ids) {
        const slide = slidesRef.current.find((s) => s.id === id);
        if (!slide) continue;
        const res = await updateSlideAction(buildSavePayload(slide));
        if ("error" in res) {
          if (res.error === "NOT_FOUND") continue;
          dirtyRef.current.add(id);
          setStatus("error");
          return;
        }
      }
      if (dirtyRef.current.size > 0) {
        setStatus("pending");
        scheduleFlush();
      } else {
        setStatus("saved");
      }
    } finally {
      flushingRef.current = false;
    }
  }

  function scheduleFlush() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flush();
    }, AUTOSAVE_DELAY_MS);
  }

  function selectSlide(id: string | null) {
    activeIdRef.current = id;
    setActiveId(id);
    const slide = slidesRef.current.find((s) => s.id === id);
    setErrors(slide ? validateEditorSlide(slide) : {});
  }

  /** The active slide as stored in state (also between renders, for event handlers). */
  function currentSlide(): EditorSlide | undefined {
    return slidesRef.current.find((s) => s.id === activeIdRef.current);
  }

  const historyRef = React.useRef(new EditorHistory());
  const [history, setHistory] = React.useState({ canUndo: false, canRedo: false });
  const syncHistory = () => setHistory({ canUndo: historyRef.current.canUndo, canRedo: historyRef.current.canRedo });

  function updateActive(patch: Partial<EditorSlide>, options: UpdateOptions = {}) {
    const id = activeIdRef.current;
    if (!id) return;

    const before = slidesRef.current.find((s) => s.id === id);
    if (before && options.record !== false) {
      const group = options.group === false ? undefined : (options.group ?? changeGroup(before, patch));
      historyRef.current.record(id, snapshotOf(before), group);
      syncHistory();
    }

    const next = slidesRef.current.map((s) => (s.id === id ? { ...s, ...patch } : s));
    commitSlides(next);
    const slide = next.find((s) => s.id === id);
    if (!slide) return;

    const slideErrors = validateEditorSlide(slide);
    setErrors(slideErrors);
    if (Object.keys(slideErrors).length > 0) {
      dirtyRef.current.delete(id);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setStatus("invalid");
      return;
    }

    lastValidRef.current[id] = slide;
    dirtyRef.current.add(id);
    setStatus("pending");
    scheduleFlush();
  }

  const readSnapshot = (slideId: string): SlideSnapshot | undefined => {
    const slide = slidesRef.current.find((s) => s.id === slideId);
    return slide && snapshotOf(slide);
  };

  /** Undo or redo one step, on whichever slide it belongs to (selected first). */
  function travel(direction: "undo" | "redo") {
    const step = historyRef.current[direction](readSnapshot);
    syncHistory();
    if (!step) return;
    if (activeIdRef.current !== step.slideId) selectSlide(step.slideId);
    updateActive(step.snapshot, { record: false });
  }

  async function addSlide(type: SlideType) {
    const res = await addSlideAction({ deckId, type });
    if ("error" in res) return setStatus("error");
    const slide = { ...toEditorSlide(res.slide), position: slidesRef.current.length };
    commitSlides([...slidesRef.current, slide]);
    lastValidRef.current[slide.id] = slide;
    selectSlide(slide.id);
  }

  /** Moves the slide at `from` to `to` (drag and drop, Task 72; ↑/↓ buttons move by one). */
  async function moveSlideTo(from: number, to: number) {
    const current = slidesRef.current;
    if (from === to || to < 0 || to >= current.length || from < 0 || from >= current.length) return;

    const next = [...current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reordered = next.map((s, i) => ({ ...s, position: i }));
    commitSlides(reordered);

    // Shown like a content save, so a reload right after a move doesn't look safe while it isn't.
    setStatus("saving");
    const res = await reorderSlidesAction({ deckId, slideIds: reordered.map((s) => s.id) });
    if ("error" in res) setStatus("error");
    else if (dirtyRef.current.size === 0 && !flushingRef.current) setStatus("saved");
  }

  async function duplicateSlide(id: string) {
    const res = await duplicateSlideAction(id);
    if ("error" in res) return setStatus("error");
    const current = slidesRef.current;
    const insertAt = current.findIndex((s) => s.id === id) + 1;
    const duplicate = toEditorSlide(res.slide);
    const next = [...current.slice(0, insertAt), duplicate, ...current.slice(insertAt)].map((s, i) => ({ ...s, position: i }));
    commitSlides(next);
    lastValidRef.current[duplicate.id] = next[insertAt];
    selectSlide(duplicate.id);
  }

  async function deleteSlide(id: string) {
    if (slidesRef.current.length <= 1) return;
    if (!window.confirm("Supprimer ce slide ?")) return;

    const res = await deleteSlideAction(id);
    if ("error" in res) {
      if (res.error !== "LAST_SLIDE") setStatus("error");
      return;
    }
    dirtyRef.current.delete(id);
    delete lastValidRef.current[id];

    const current = slidesRef.current;
    const index = current.findIndex((s) => s.id === id);
    const next = current.filter((s) => s.id !== id).map((s, i) => ({ ...s, position: i }));
    commitSlides(next);
    if (activeIdRef.current === id) {
      const fallback = next[Math.min(index, next.length - 1)];
      selectSlide(fallback ? fallback.id : null);
    }
    if (dirtyRef.current.size === 0 && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setStatus((s) => (s === "invalid" ? s : "idle"));
    }
  }

  const activeSlide = slides.find((s) => s.id === activeId) ?? null;

  // The canvas shows the last valid version while the form holds an invalid one.
  const previewSlide = React.useMemo(() => {
    if (!activeSlide) return null;
    if (Object.keys(validateEditorSlide(activeSlide)).length === 0) return activeSlide;
    return lastValidRef.current[activeSlide.id] ?? activeSlide;
  }, [activeSlide]);

  return {
    slides,
    activeId,
    activeSlide,
    previewSlide,
    errors,
    status,
    setStatus,
    currentSlide,
    selectSlide,
    updateActive,
    undo: () => travel("undo"),
    redo: () => travel("redo"),
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    addSlide,
    moveSlide: (index: number, direction: -1 | 1) => moveSlideTo(index, index + direction),
    moveSlideTo,
    duplicateSlide,
    deleteSlide,
  };
}

export type EditorState = ReturnType<typeof useEditorState>;
