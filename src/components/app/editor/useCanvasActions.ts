"use client";

import * as React from "react";
import { toast } from "sonner";
import { setContentPath } from "@/lib/slides/content-path";
import { isPlainRich, richToPlain, type RichText } from "@/lib/slides/rich-text";
import type { FreeElement } from "@/lib/slides/free";
import type { ItemAction } from "@/components/slides/editable";
import { applyListAction } from "./list-actions";
import { FREE_MESSAGES, ITEM_MESSAGES, REGENERATE_MESSAGES } from "./messages";
import type { EditorSlide } from "./validation";
import { SLIDE_STYLE_KEYS } from "@/lib/slides/schema";

/** The slide-look keys of a content (illustration, background, transition) that are set. */
const styleOf = (content: Record<string, unknown>) =>
  Object.fromEntries(SLIDE_STYLE_KEYS.filter((k) => content[k] !== undefined).map((k) => [k, content[k]]));
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
    // One undo step per typing burst in the same text.
    if (slide) updateActive({ content: setContentPath(slide.content, path, value) }, { group: `text:${path}` });
  }

  function setImage(path: string, assetId: string | undefined) {
    const slide = currentSlide();
    if (slide) updateActive({ content: setContentPath(slide.content, path, assetId) });
  }

  /**
   * A freeform text typed in (Task 76): its rich text, and the plain `text` mirror. A text with
   * no formatting keeps only the plain text. One undo step per typing burst.
   */
  function editRich(path: string, rich: RichText) {
    const slide = currentSlide();
    if (slide?.type !== "free") return;
    const index = Number(path.split(".")[1]);
    const elements = (slide.content.elements as FreeElement[] | undefined) ?? [];
    const element = elements[index];
    if (element?.kind !== "text") return;
    const next: FreeElement = { ...element, text: richToPlain(rich) };
    if (isPlainRich(rich)) delete next.rich;
    else next.rich = rich;
    const updated = elements.map((e, i) => (i === index ? next : e));
    updateActive({ content: { ...slide.content, elements: updated } }, { group: `text:${path}` });
  }

  /** A freeform change: its own undo step (a drag, a style), unless grouped (a slider drag). */
  function setFreeElements(elements: FreeElement[], group?: string) {
    const slide = currentSlide();
    if (slide?.type === "free") updateActive({ content: { ...slide.content, elements } }, { group: group ?? false });
  }

  function convertToFree(elements: FreeElement[]) {
    const slide = currentSlide();
    if (!slide || slide.type === "free") return;
    const previous = { type: slide.type, content: slide.content, layout: slide.layout };
    updateActive({ type: "free", content: { elements, ...styleOf(slide.content) }, layout: undefined });
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
      // The AI rewrites the words; the slide's own look (illustration, background…) stays.
      if (data.slide) updateActive({ content: { ...data.slide.content, ...styleOf(slide.content) }, notes: data.slide.notes, script: data.slide.script });
    } catch {
      setRegenerateError(REGENERATE_MESSAGES.failed);
    } finally {
      setIsRegenerating(false);
    }
  }

  return { editText, editRich, setImage, setFreeElements, convertToFree, itemAction, regenerate, isRegenerating, regenerateError };
}
