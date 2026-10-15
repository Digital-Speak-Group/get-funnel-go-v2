import type { EditorSlide } from "./validation";

/** The parts of a slide an edit can change (everything but its id and position). */
export type SlideSnapshot = Pick<EditorSlide, "type" | "content" | "layout" | "notes" | "script" | "cue">;

export const snapshotOf = (slide: EditorSlide): SlideSnapshot => ({
  type: slide.type,
  content: slide.content,
  layout: slide.layout,
  notes: slide.notes,
  script: slide.script,
  cue: slide.cue,
});

interface Step {
  slideId: string;
  snapshot: SlideSnapshot;
}

/**
 * Undo/redo for the whole editor (Task 69): snapshots of a slide taken before each change.
 * Changes in the same `group` (one field being typed in) less than `mergeMs` apart are one
 * step, so undo takes back a word burst, not a letter. Slide add/delete/reorder are not here.
 */
export class EditorHistory {
  private past: Step[] = [];
  private future: Step[] = [];
  private lastGroup: string | null = null;
  private lastAt = 0;

  constructor(
    private readonly limit = 100,
    private readonly mergeMs = 1000
  ) {}

  /** Call with the slide as it was before a change. */
  record(slideId: string, before: SlideSnapshot, group?: string, now = Date.now()): void {
    const merge =
      group !== undefined &&
      group === this.lastGroup &&
      now - this.lastAt < this.mergeMs &&
      this.past.at(-1)?.slideId === slideId;
    this.lastGroup = group ?? null;
    this.lastAt = now;
    if (merge) return;
    this.past.push({ slideId, snapshot: before });
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  /**
   * The step to restore, given a way to read a slide's current state (to redo it later).
   * Steps of slides deleted since are skipped.
   */
  undo(current: (slideId: string) => SlideSnapshot | undefined): Step | null {
    return this.move(this.past, this.future, current);
  }

  redo(current: (slideId: string) => SlideSnapshot | undefined): Step | null {
    return this.move(this.future, this.past, current);
  }

  private move(from: Step[], to: Step[], current: (slideId: string) => SlideSnapshot | undefined): Step | null {
    this.lastGroup = null;
    for (let step = from.pop(); step; step = from.pop()) {
      const now = current(step.slideId);
      if (!now) continue;
      to.push({ slideId: step.slideId, snapshot: now });
      return step;
    }
    return null;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }
}

/** Merge group of a change: the fields it touches (content keys for content), so typing merges. */
export function changeGroup(before: EditorSlide, patch: Partial<EditorSlide>): string {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(patch)) {
    if (key === "content" && value && typeof value === "object") {
      const next = value as Record<string, unknown>;
      for (const k of new Set([...Object.keys(before.content), ...Object.keys(next)])) {
        if (before.content[k] !== next[k]) keys.push(`content.${k}`);
      }
    } else if (before[key as keyof EditorSlide] !== value) {
      keys.push(key);
    }
  }
  return keys.sort().join(",");
}
