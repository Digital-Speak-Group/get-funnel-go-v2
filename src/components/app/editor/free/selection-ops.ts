import { MAX_FREE_ELEMENTS, type FreeElement } from "@/lib/slides/free";
import { cloneElements, updateElements } from "./free-ops";

/**
 * Selection-level operations of the freeform editor (Task 70): groups, locks, distribution,
 * paste. Pure like free-ops: new arrays, inputs untouched, null when not possible.
 */

/** The selection plus every element sharing a group with it, in paint order. */
export function expandToGroups(elements: FreeElement[], ids: readonly string[]): string[] {
  const picked = new Set(ids);
  const groups = new Set(elements.filter((e) => picked.has(e.id) && e.groupId).map((e) => e.groupId));
  return elements.filter((e) => picked.has(e.id) || (e.groupId && groups.has(e.groupId))).map((e) => e.id);
}

/** The ids that may move or be deleted (not locked). */
export function unlockedIds(elements: FreeElement[], ids: readonly string[]): string[] {
  const picked = new Set(ids);
  return elements.filter((e) => picked.has(e.id) && !e.locked).map((e) => e.id);
}

/** One new group for the selection (2+ elements), replacing the groups they were in. */
export function groupElements(elements: FreeElement[], ids: readonly string[]): FreeElement[] | null {
  if (ids.length < 2) return null;
  const groupId = crypto.randomUUID();
  return updateElements(elements, ids, (e) => ({ ...e, groupId }));
}

/** Dissolves every group the selection touches. */
export function ungroupElements(elements: FreeElement[], ids: readonly string[]): FreeElement[] | null {
  const all = expandToGroups(elements, ids);
  if (!elements.some((e) => all.includes(e.id) && e.groupId)) return null;
  return updateElements(elements, all, (e) => {
    const next = { ...e };
    delete next.groupId;
    return next;
  });
}

export function setLocked(elements: FreeElement[], ids: readonly string[], locked: boolean): FreeElement[] {
  return updateElements(elements, ids, (e) => {
    const next = { ...e, locked: true };
    if (!locked) delete (next as Partial<FreeElement>).locked;
    return next;
  });
}

/**
 * Equal gaps between the selected elements (3+, unlocked) along one axis; the two outer
 * ones stay where they are.
 */
export function distributeElements(
  elements: FreeElement[],
  ids: readonly string[],
  axis: "horizontal" | "vertical"
): FreeElement[] | null {
  const movable = unlockedIds(elements, ids);
  const picked = elements.filter((e) => movable.includes(e.id));
  if (picked.length < 3) return null;
  const pos = axis === "horizontal" ? "x" : "y";
  const size = axis === "horizontal" ? "w" : "h";
  const sorted = [...picked].sort((a, b) => a[pos] - b[pos]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = last[pos] + last[size] - first[pos];
  const gap = (span - sorted.reduce((sum, e) => sum + e[size], 0)) / (sorted.length - 1);

  const target = new Map<string, number>();
  let cursor = first[pos];
  for (const e of sorted) {
    target.set(e.id, Math.round(cursor));
    cursor += e[size] + gap;
  }
  return updateElements(elements, movable, (e) => ({ ...e, [pos]: target.get(e.id)! }));
}

/**
 * Copies of `clip` added on top with new ids (groups kept among the copies, under new group
 * ids), shifted by `offset`. Null when they would not fit under the element limit.
 */
export function pasteElements(
  elements: FreeElement[],
  clip: readonly FreeElement[],
  offset: number
): { elements: FreeElement[]; ids: string[] } | null {
  if (clip.length === 0 || elements.length + clip.length > MAX_FREE_ELEMENTS) return null;
  const copies = cloneElements(clip, offset);
  return { elements: [...elements, ...copies], ids: copies.map((c) => c.id) };
}
