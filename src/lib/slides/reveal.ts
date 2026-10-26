import type { FreeElement } from "./free";

/**
 * The build steps of a slide (Task 75): the distinct reveal steps of its freeform elements,
 * in order. Empty for structured slides and for freeform slides without reveals.
 */
export function revealSteps(slide: { type: string; content: unknown }): number[] {
  if (slide.type !== "free") return [];
  const elements = (slide.content as { elements?: unknown } | null)?.elements;
  if (!Array.isArray(elements)) return [];
  const steps = new Set<number>();
  for (const element of elements as FreeElement[]) {
    const step = element?.reveal?.step;
    if (typeof step === "number") steps.add(step);
  }
  return [...steps].sort((a, b) => a - b);
}

/**
 * The step value shown after `count` presses of "next" on this slide: elements with a reveal
 * step ≤ the result are visible. 0 = none revealed yet; Infinity = everything (count past the end).
 */
export function revealedUpTo(steps: number[], count: number): number {
  if (count <= 0) return 0;
  return count >= steps.length ? Infinity : steps[count - 1];
}
