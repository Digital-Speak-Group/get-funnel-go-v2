"use client";

import { Sparkles } from "lucide-react";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import type { ThemeTokens } from "@/lib/slides/theme";
import type { Slide } from "@/lib/slides/schema";
import { SLIDE_TYPE_LABELS } from "./messages";
import type { EditorSlide } from "./validation";

interface SlideCanvasProps {
  slide: EditorSlide | null;
  theme: ThemeTokens;
}

export function SlideCanvas({ slide, theme }: SlideCanvasProps) {
  if (!slide) {
    return (
      <div
        data-testid="editor-empty"
        className="flex aspect-video flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15">
          <Sparkles className="h-6 w-6 text-violet-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">
          Ce deck n’a pas encore de slide
        </h2>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          Ajoutez un slide dans la liste à gauche pour commencer à construire
          votre présentation.
        </p>
      </div>
    );
  }

  const preview = {
    id: slide.id,
    position: slide.position,
    type: slide.type,
    content: slide.content,
    notes: slide.notes || undefined,
    script: slide.script || undefined,
  } as unknown as Slide;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span data-testid="canvas-caption">
          Slide {slide.position + 1} — {SLIDE_TYPE_LABELS[slide.type]}
        </span>
      </div>
      <div
        data-testid="slide-canvas"
        className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
      >
        <SlideThumbnail
          slide={preview}
          theme={theme}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
