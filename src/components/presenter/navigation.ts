/**
 * Presenter navigation with build steps (Task 75): "next" first reveals the current slide's
 * remaining steps, then moves on; "previous" hides them again, then goes back to the previous
 * slide fully built. Jumps (strip, Home/End) land on a slide with nothing revealed yet.
 */
export interface PresenterPosition {
  index: number;
  /** Build steps revealed on the current slide (0..stepCount). */
  step: number;
}

export type PresenterMove = "next" | "previous" | "first" | "last" | { goTo: number };

export function navigate(
  position: PresenterPosition,
  move: PresenterMove,
  slideCount: number,
  stepCount: (index: number) => number
): PresenterPosition {
  const last = Math.max(0, slideCount - 1);
  const clamp = (i: number) => Math.max(0, Math.min(last, i));
  const { index, step } = position;

  if (move === "next") {
    if (step < stepCount(index)) return { index, step: step + 1 };
    return index < last ? { index: index + 1, step: 0 } : position;
  }
  if (move === "previous") {
    if (step > 0) return { index, step: step - 1 };
    return index > 0 ? { index: index - 1, step: stepCount(index - 1) } : position;
  }
  if (move === "first") return { index: 0, step: 0 };
  if (move === "last") return { index: last, step: 0 };
  const target = clamp(move.goTo);
  return target === index ? position : { index: target, step: 0 };
}
