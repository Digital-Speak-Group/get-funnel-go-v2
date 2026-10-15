import type { FreeElement } from "@/lib/slides/free";

/**
 * The freeform editor's clipboard (Task 70): kept in memory for the editing session, so
 * elements copied on one slide paste onto any other freeform slide of any deck in this tab.
 * Each paste onto the slide they came from lands a step further, like Canva.
 */
let clip: { elements: FreeElement[]; slideId: string; pastes: number } | null = null;

const PASTE_OFFSET = 24;

export function copyToClipboard(elements: FreeElement[], slideId: string): void {
  clip = { elements: structuredClone(elements), slideId, pastes: 0 };
}

export function hasClipboard(): boolean {
  return !!clip && clip.elements.length > 0;
}

/** What to paste on `slideId` and how far to shift it. */
export function readClipboard(slideId: string): { elements: FreeElement[]; offset: number } | null {
  if (!clip) return null;
  const sameSlide = clip.slideId === slideId;
  clip.pastes += 1;
  return { elements: clip.elements, offset: sameSlide ? clip.pastes * PASTE_OFFSET : (clip.pastes - 1) * PASTE_OFFSET };
}
