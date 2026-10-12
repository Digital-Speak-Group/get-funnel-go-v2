"use client";

import * as React from "react";
import { Maximize2, Minimize2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { SlideEditProvider, type ItemAction, type SlideItemApi } from "@/components/slides/editable";
import { canApply, listBounds } from "./list-actions";
import type { ThemeTokens } from "@/lib/slides/theme";
import type { Slide } from "@/lib/slides/schema";
import { CANVAS_MESSAGES, ITEM_MESSAGES, SLIDE_TYPE_LABELS, fieldLabel } from "./messages";
import type { EditorSlide } from "./validation";

interface SlideCanvasProps {
  slide: EditorSlide | null;
  theme: ThemeTokens;
  /** A text edited directly on the slide: its content path and new value. */
  onEditText: (path: string, value: string) => void;
  /** Move, duplicate or delete an item of the list at `path`. */
  onItemAction: (path: string, action: ItemAction, index: number) => void;
  /** Inspector hidden so the slide gets the room to edit on. */
  focused: boolean;
  onToggleFocus: () => void;
}

/** Field label of the last named segment: `painPoints.0.title` → label of `title`. */
const placeholderFor = (path: string) => fieldLabel(path.split(".").filter((p) => !/^\d+$/.test(p)).pop() ?? path);

export function SlideCanvas({ slide, theme, onEditText, onItemAction, focused, onToggleFocus }: SlideCanvasProps) {
  const type = slide?.type;
  const items = React.useMemo<SlideItemApi | undefined>(
    () =>
      type && {
        can: (path, action, index, length) => canApply(action, index, length, listBounds(type, path)),
        act: onItemAction,
        label: (action) => ITEM_MESSAGES[action],
      },
    [type, onItemAction]
  );

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
    layout: slide.layout,
  } as unknown as Slide;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span data-testid="canvas-caption">
          Slide {slide.position + 1} — {SLIDE_TYPE_LABELS[slide.type]}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-small text-faint xl:inline">{CANVAS_MESSAGES.hint}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            aria-pressed={focused}
            className="hidden lg:inline-flex"
            data-testid="canvas-focus"
          >
            {focused ? <Minimize2 /> : <Maximize2 />}
            {focused ? CANVAS_MESSAGES.unfocus : CANVAS_MESSAGES.focus}
          </Button>
        </div>
      </div>
      <div
        data-testid="slide-canvas"
        className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900"
      >
        <SlideEditProvider onEdit={onEditText} placeholderFor={placeholderFor} items={items}>
          <SlideThumbnail
            slide={preview}
            theme={theme}
            className="absolute inset-0 h-full w-full"
          />
        </SlideEditProvider>
      </div>
    </div>
  );
}
