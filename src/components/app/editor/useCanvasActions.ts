"use client";

import * as React from "react";
import { toast } from "sonner";
import { setContentPath } from "@/lib/slides/content-path";
import type { FreeElement } from "@/lib/slides/free";
import type { ItemAction } from "@/components/slides/editable";
import { applyListAction } from "./list-actions";
import { FREE_MESSAGES, ITEM_MESSAGES, REGENERATE_MESSAGES } from "./messages";
import type { EditorSlide } from "./validation";
import type { EditorState } from "./useEditorState";

/**
 * Everything the canvas and the inspector can do to the active slide beyond plain field
 * edits: inline text, images, list items, freeform elements, conversion, AI regeneration.
 * Destructive changes (item delete, conversion) offer "Annuler" in a toast.
 */
export function useCanvasActions(editor: EditorState) {
  const { currentSlide, updateActive, selectSlide, activeId } = editor;
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const [regenerateError, setRegenerateError] = React.useState<string | undefined>();

  // A message about one slide's regeneration doesn't carry over to the next slide.
  React.useEffect(() => setRegenerateError(undefined), [activeId]);

  /** Puts `patch` back on `slide`, reselecting it first if the user moved on. */
  function restore(slide: EditorSlide, patch: Partial<EditorSlide>) {
    if (currentSlide()?.id !== slide.id) selectSlide(slide.id);
    updateActive(patch);
  }

  function editText(path: string, value: string) {
    const slide = currentSlide();
    if (slide) updateActive({ content: setContentPath(slide.content, path, value) });
  }

  function setImage(path: string, assetId: string | undefined) {
    const slide = currentSlide();
    if (slide) updateActive({ content: setContentPath(slide.content, path, assetId) });
  }

  function setFreeElements(elements: FreeElement[]) {
    const slide = currentSlide();
    if (slide?.type === "free") updateActive({ content: { ...slide.content, elements } });
  }

  function convertToFree(elements: FreeElement[]) {
    const slide = currentSlide();
    if (!slide || slide.type === "free") return;
    const previous = { type: slide.type, content: slide.content, layout: slide.layout };
    const illustration = slide.content.illustration;
    updateActive({ type: "free", content: { elements, ...(illustration ? { illustration } : {}) }, layout: undefined });
    toast.success(FREE_MESSAGES.converted, {
      action: { label: FREE_MESSAGES.undo, onClick: () => restore(slide, previous) },
    });
  }

  function itemAction(path: string, action: ItemAction, index: number) {
    const slide = currentSlide();
    if (!slide) return;
    const next = applyListAction(slide.type, slide.content, path, action, index);
    if (!next) return;
    const previous = slide.content;
    updateActive({ content: next });
    if (action === "remove") {
      toast(ITEM_MESSAGES.removed, {
        action: { label: ITEM_MESSAGES.undo, onClick: () => restore(slide, { content: previous }) },
      });
    }
  }

  async function regenerate(instructions: string) {
    const slide = currentSlide();
    if (!slide || isRegenerating) return;
    setIsRegenerating(true);
    setRegenerateError(undefined);
    try {
      const res = await fetch("/api/ai/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slideId: slide.id, instructions: instructions || undefined }),
      });
      if (!res.ok) {
        // Shown in the regenerate panel, not the save status: nothing failed to save.
        setRegenerateError(
          res.status === 402
            ? REGENERATE_MESSAGES.noCredits
            : res.status === 429
              ? REGENERATE_MESSAGES.rateLimited
              : REGENERATE_MESSAGES.failed
        );
        return;
      }
      const data = await res.json();
      if (data.slide) updateActive({ content: data.slide.content, notes: data.slide.notes, script: data.slide.script });
    } catch {
      setRegenerateError(REGENERATE_MESSAGES.failed);
    } finally {
      setIsRegenerating(false);
    }
  }

  return { editText, setImage, setFreeElements, convertToFree, itemAction, regenerate, isRegenerating, regenerateError };
}
