import type { FreeElement } from "@/lib/slides/free";

/**
 * Undo/redo for one freeform slide during an editing session: snapshots of the element
 * list taken before each structural change (move, resize, add, delete, style…).
 */
export class FreeHistory {
  private past: FreeElement[][] = [];
  private future: FreeElement[][] = [];

  constructor(private readonly limit = 50) {}

  /** Call with the elements as they were before a change. */
  record(before: FreeElement[]): void {
    this.past.push(before);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  /** The elements to restore, or null when there is nothing to undo. */
  undo(current: FreeElement[]): FreeElement[] | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(current);
    return previous;
  }

  redo(current: FreeElement[]): FreeElement[] | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    return next;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }
}
