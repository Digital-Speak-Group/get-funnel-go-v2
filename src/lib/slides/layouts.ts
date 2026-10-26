import type { SlideType } from "./schema";

/**
 * Layout variants per slide type (Task 59). The first entry is the type's original renderer,
 * so a slide with no `layout` and one with the first layout render identically. Content is
 * the same for every layout of a type: switching layouts never touches it.
 */
export const SLIDE_LAYOUTS = {
  cover: ["center", "split", "editorial"],
  statement: ["center", "left", "banner"],
  problem: ["grid", "list", "aside"],
  benefits: ["grid", "checklist", "featured"],
  flow: ["cards", "timeline", "grid"],
  kpi: ["row", "cards", "hero"],
  proof: ["cards", "quote", "table"],
  cta: ["center", "split", "banner"],
} as const satisfies Partial<Record<SlideType, readonly [string, ...string[]]>>;

export type LayoutSlideType = keyof typeof SLIDE_LAYOUTS;

export function layoutsFor(type: SlideType): readonly string[] {
  return (SLIDE_LAYOUTS as Partial<Record<SlideType, readonly string[]>>)[type] ?? [];
}

/**
 * Gives generated slides varied layouts without spending model tokens: each type cycles
 * through its layouts in order of appearance (the first one keeps the original look), and a
 * slide never repeats the layout name of the slide just before it.
 */
export function assignLayouts<T extends { type: SlideType; layout?: string }>(slides: T[]): T[] {
  const seen = new Map<SlideType, number>();
  let previous: string | undefined;
  return slides.map((slide) => {
    const options = layoutsFor(slide.type);
    if (options.length === 0) {
      previous = undefined;
      return slide;
    }
    const occurrence = seen.get(slide.type) ?? 0;
    seen.set(slide.type, occurrence + 1);
    let pick = options[occurrence % options.length];
    for (let step = 1; pick === previous && step < options.length; step++) {
      pick = options[(occurrence + step) % options.length];
    }
    previous = pick;
    return { ...slide, layout: pick };
  });
}

/** Stored layout → a valid layout of `type`, or undefined (original look). Never drops a slide. */
export function validLayout(type: string, raw: unknown): string | undefined {
  return typeof raw === "string" && layoutsFor(type as SlideType).includes(raw) ? raw : undefined;
}
