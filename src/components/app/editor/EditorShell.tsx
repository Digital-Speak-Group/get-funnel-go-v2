"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Play, Download } from "lucide-react";
import { ThemePicker } from "@/components/app/ThemePicker";
import {
  ThemeTokensSchema,
  systemThemes,
  type ThemeTokens,
} from "@/lib/slides/theme";
import { SLIDE_TYPES, type SlideType } from "@/lib/slides/schema";
import type { DeckWithRelations } from "@/lib/db/repositories/decks";
import type { SlideWithDeck } from "@/lib/db/repositories/slides";
import type { SystemTheme } from "@/lib/db/repositories/themes";
import { updateDeckAction } from "@/app/(app)/app/decks/actions";
import {
  addSlideAction,
  deleteSlideAction,
  duplicateSlideAction,
  reorderSlidesAction,
  updateSlideAction,
} from "@/app/(app)/app/decks/slides";
import { SlideList } from "./SlideList";
import { SlideCanvas } from "./SlideCanvas";
import { SlideFields } from "./SlideFields";
import { STATUS_LABELS } from "./messages";
import {
  buildSavePayload,
  validateEditorSlide,
  type EditorSlide,
} from "./validation";
import type { FieldErrors } from "./field-schema";
import { cn } from "@/lib/utils";

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "invalid" | "error";

const STATUS_CLASSES: Record<SaveStatus, string> = {
  idle: "bg-zinc-800 text-zinc-300",
  pending: "bg-violet-500/10 text-violet-300",
  saving: "bg-violet-500/10 text-violet-300",
  saved: "bg-zinc-800 text-white",
  invalid: "bg-red-500/10 text-red-400",
  error: "bg-red-500/10 text-red-400",
};

function toEditorSlide(slide: SlideWithDeck): EditorSlide {
  const validType = (SLIDE_TYPES as readonly string[]).includes(slide.type);
  return {
    id: slide.id,
    position: slide.position,
    type: validType ? (slide.type as SlideType) : "cover",
    content: (slide.content ?? {}) as Record<string, unknown>,
    notes: slide.notes ?? "",
    script: slide.script ?? "",
  };
}

interface EditorShellProps {
  deck: DeckWithRelations;
  initialSlides: SlideWithDeck[];
  themes: SystemTheme[];
}

export function EditorShell({ deck, initialSlides, themes }: EditorShellProps) {
  const [slides, setSlides] = React.useState<EditorSlide[]>(() =>
    initialSlides.map(toEditorSlide)
  );
  const [activeId, setActiveId] = React.useState<string | null>(
    initialSlides[0]?.id ?? null
  );
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<SaveStatus>("idle");
  const [themeId, setThemeId] = React.useState<string>(deck.themeId);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

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
      if (Object.keys(validateEditorSlide(slide)).length === 0) {
        lastValidRef.current[slide.id] = slide;
      }
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

  function updateActive(patch: Partial<EditorSlide>) {
    const id = activeIdRef.current;
    if (!id) return;

    const next = slidesRef.current.map((s) =>
      s.id === id ? { ...s, ...patch } : s
    );
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

  async function handleAdd(type: SlideType) {
    const res = await addSlideAction({ deckId: deck.id, type });
    if ("error" in res) {
      setStatus("error");
      return;
    }
    const slide = toEditorSlide(res.slide);
    const position = slidesRef.current.length;
    const next = [...slidesRef.current, { ...slide, position }];
    commitSlides(next);
    lastValidRef.current[slide.id] = { ...slide, position };
    selectSlide(slide.id);
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const current = slidesRef.current;
    const target = index + direction;
    if (target < 0 || target >= current.length) return;

    const next = [...current];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    const reordered = next.map((s, i) => ({ ...s, position: i }));
    commitSlides(reordered);

    const res = await reorderSlidesAction({
      deckId: deck.id,
      slideIds: reordered.map((s) => s.id),
    });
    if ("error" in res) setStatus("error");
  }

  async function handleDuplicate(id: string) {
    const res = await duplicateSlideAction(id);
    if ("error" in res) {
      setStatus("error");
      return;
    }
    const current = slidesRef.current;
    const index = current.findIndex((s) => s.id === id);
    const insertAt = index + 1;
    const duplicate = toEditorSlide(res.slide);
    const next = [
      ...current.slice(0, insertAt),
      duplicate,
      ...current.slice(insertAt),
    ].map((s, i) => ({ ...s, position: i }));
    commitSlides(next);
    lastValidRef.current[duplicate.id] = next[insertAt];
    selectSlide(duplicate.id);
  }

  async function handleDelete(id: string) {
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
    const next = current
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, position: i }));
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

  async function handleThemeSelect(slug: string) {
    const row = themes.find((t) => t.tokens.id === slug);
    if (!row || row.id === themeId) return;
    const previous = themeId;
    setThemeId(row.id);
    const res = await updateDeckAction({ id: deck.id, themeId: row.id });
    if ("error" in res) {
      setThemeId(previous);
      setStatus("error");
    }
  }

  async function handleRegenerate() {
    if (!activeId || isRegenerating) return;
    setIsRegenerating(true);
    setStatus("saving");

    try {
      const res = await fetch("/api/ai/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId: activeId }),
      });

      if (!res.ok) {
        throw new Error("Failed to regenerate slide");
      }

      const data = await res.json();
      if (data.slide) {
        // update the slide locally
        updateActive({
          content: data.slide.content,
          notes: data.slide.notes,
          script: data.slide.script,
        });
        setStatus("saved");
      }
    } catch {
      setStatus("error");
    } finally {
      setIsRegenerating(false);
    }
  }

  const activeSlide =
    slides.find((s) => s.id === activeId) ?? null;

  const previewSlide = React.useMemo(() => {
    if (!activeSlide) return null;
    const isValid =
      Object.keys(validateEditorSlide(activeSlide)).length === 0;
    if (isValid) return activeSlide;
    return lastValidRef.current[activeSlide.id] ?? activeSlide;
  }, [activeSlide]);

  const previewTheme = React.useMemo<ThemeTokens>(() => {
    const row = themes.find((t) => t.id === themeId);
    if (row) return row.tokens;
    const parsed = ThemeTokensSchema.safeParse(deck.theme?.tokens);
    if (parsed.success) return parsed.data;
    return systemThemes[0];
  }, [themeId, themes, deck.theme]);

  const selectedThemeSlug =
    themes.find((t) => t.id === themeId)?.tokens.id ??
    systemThemes[0]?.id ??
    "";

  return (
    <div className="space-y-4" data-testid="editor-shell">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/app"
            aria-label="Retour au tableau de bord"
            className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1
              className="truncate text-2xl font-bold text-white"
              data-testid="editor-title"
            >
              {deck.title}
            </h1>
            <p className="text-sm text-zinc-400">
              {slides.length} slide{slides.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            role="status"
            data-testid="editor-status"
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              STATUS_CLASSES[status]
            )}
          >
            {STATUS_LABELS[status]}
          </div>
          <Link
            href={`/present/${deck.id}`}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Présenter</span>
          </Link>
          <a
            href={`/api/decks/${deck.id}/export`}
            download
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)_380px]">
        <SlideList
          slides={slides}
          activeId={activeId}
          onSelect={selectSlide}
          onMove={handleMove}
          onAdd={(type) => void handleAdd(type)}
          onDuplicate={(id) => void handleDuplicate(id)}
          onDelete={(id) => void handleDelete(id)}
        />
        <SlideCanvas slide={previewSlide} theme={previewTheme} />
        <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          {activeSlide ? (
            <SlideFields
              slide={activeSlide}
              errors={errors}
              onChange={updateActive}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />
          ) : (
            <p className="text-sm text-zinc-500">
              Ajoutez un slide pour commencer l’édition.
            </p>
          )}
          <div className="border-t border-zinc-800 pt-4">
            <ThemePicker
              selectedThemeId={selectedThemeSlug}
              onSelect={(slug) => void handleThemeSelect(slug)}
              variant="list"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
