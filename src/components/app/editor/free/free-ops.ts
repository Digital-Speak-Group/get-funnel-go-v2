import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_FREE_ELEMENTS,
  type FreeElement,
  type FreeIcon,
  type FreeVideo,
  type ShapeName,
} from "@/lib/slides/free";
import { FREE_MESSAGES } from "./messages";

/**
 * Pure operations on a freeform slide's elements (Task 68). Every function returns a new
 * array (or null when the action is not possible) and never mutates its input.
 */

export type NewElementKind = "text" | "image" | "icon" | "table" | "chart" | ShapeName;

/** At least this much of an element stays on the canvas, so it can always be grabbed back. */
const MIN_VISIBLE = 40;
const DUPLICATE_OFFSET = 24;

export function clampToCanvas<E extends FreeElement>(element: E): E {
  const x = Math.min(Math.max(element.x, MIN_VISIBLE - element.w), CANVAS_WIDTH - MIN_VISIBLE);
  const y = Math.min(Math.max(element.y, MIN_VISIBLE - element.h), CANVAS_HEIGHT - MIN_VISIBLE);
  return x === element.x && y === element.y ? element : { ...element, x: Math.round(x), y: Math.round(y) };
}

/** A new element of `kind`, centred on the canvas (or at `at`). */
export function makeElement(kind: NewElementKind, at?: { x: number; y: number }, icon?: FreeIcon["icon"]): FreeElement {
  const id = crypto.randomUUID();
  const centred = (w: number, h: number) => ({
    x: Math.round(at?.x ?? (CANVAS_WIDTH - w) / 2),
    y: Math.round(at?.y ?? (CANVAS_HEIGHT - h) / 2),
    w,
    h,
  });
  switch (kind) {
    case "text":
      return { id, kind: "text", text: "Votre texte", style: "body", ...centred(600, 80) };
    case "rect":
      return { id, kind: "shape", shape: "rect", fill: "surface", radius: 16, ...centred(480, 280) };
    case "ellipse":
      return { id, kind: "shape", shape: "ellipse", fill: "primary", ...centred(240, 240) };
    case "line":
      return { id, kind: "shape", shape: "line", fill: "muted", ...centred(600, 8) };
    case "triangle":
      return { id, kind: "shape", shape: "triangle", fill: "primary", ...centred(300, 260) };
    case "diamond":
      return { id, kind: "shape", shape: "diamond", fill: "accent", ...centred(280, 280) };
    case "arrow":
      return { id, kind: "shape", shape: "arrow", fill: "primary", ...centred(420, 200) };
    case "star":
      return { id, kind: "shape", shape: "star", fill: "accent", ...centred(300, 300) };
    case "bubble":
      return { id, kind: "shape", shape: "bubble", fill: "surface", stroke: "primary", strokeWidth: 3, ...centred(520, 320) };
    case "image":
      return { id, kind: "image", fit: "cover", radius: 12, ...centred(640, 360) };
    case "table":
      return {
        id,
        kind: "table",
        header: true,
        variant: "lines",
        rows: [
          [FREE_MESSAGES.table.sample.head(1), FREE_MESSAGES.table.sample.head(2), FREE_MESSAGES.table.sample.head(3)],
          ...Array.from({ length: 2 }, () => Array.from({ length: 3 }, () => FREE_MESSAGES.table.sample.cell)),
        ],
        ...centred(960, 300),
      };
    case "chart":
      return {
        id,
        kind: "chart",
        chart: "bar",
        data: FREE_MESSAGES.chart.sample.map((label, i) => ({ label, value: [42, 58, 71, 86][i] })),
        ...centred(880, 480),
      };
    case "icon":
      return { id, kind: "icon", icon: icon ?? "sparkles", color: "primary", ...centred(120, 120) };
  }
}

/** A video element for a parsed YouTube/Vimeo link (Task 78), centred, 16:9. */
export function makeVideoElement(video: { provider: FreeVideo["provider"]; videoId: string }): FreeVideo {
  return { id: crypto.randomUUID(), kind: "video", ...video, x: 480, y: 270, w: 960, h: 540 };
}

export function addElement(elements: FreeElement[], element: FreeElement): FreeElement[] | null {
  if (elements.length >= MAX_FREE_ELEMENTS) return null;
  return [...elements, element];
}

/** Applies `patch` to the selected elements (result clamped to the canvas). */
export function updateElements(
  elements: FreeElement[],
  ids: readonly string[],
  patch: (element: FreeElement) => FreeElement
): FreeElement[] {
  const selected = new Set(ids);
  return elements.map((e) => (selected.has(e.id) ? clampToCanvas(patch(e)) : e));
}

export function removeElements(elements: FreeElement[], ids: readonly string[]): FreeElement[] {
  const selected = new Set(ids);
  return elements.filter((e) => !selected.has(e.id));
}

/** Copies of the selection, offset a little and placed on top. Null past the element limit. */
export function duplicateElements(
  elements: FreeElement[],
  ids: readonly string[]
): { elements: FreeElement[]; ids: string[] } | null {
  const selected = elements.filter((e) => ids.includes(e.id));
  if (selected.length === 0 || elements.length + selected.length > MAX_FREE_ELEMENTS) return null;
  const copies = cloneElements(selected, DUPLICATE_OFFSET);
  return { elements: [...elements, ...copies], ids: copies.map((c) => c.id) };
}

/** Copies with new ids, shifted by `offset`; groups stay among the copies, under new group ids. */
export function cloneElements(source: readonly FreeElement[], offset: number): FreeElement[] {
  const groups = new Map<string, string>();
  return source.map((e) => {
    const copy: FreeElement = { ...structuredClone(e), id: crypto.randomUUID(), x: e.x + offset, y: e.y + offset };
    if (e.groupId) {
      if (!groups.has(e.groupId)) groups.set(e.groupId, crypto.randomUUID());
      copy.groupId = groups.get(e.groupId);
    }
    return clampToCanvas(copy);
  });
}

/** Layer order: array order is paint order (last = on top). */
export function reorderElements(
  elements: FreeElement[],
  ids: readonly string[],
  move: "forward" | "backward" | "front" | "back"
): FreeElement[] {
  const selected = new Set(ids);
  const picked = elements.filter((e) => selected.has(e.id));
  const rest = elements.filter((e) => !selected.has(e.id));
  if (move === "front") return [...rest, ...picked];
  if (move === "back") return [...picked, ...rest];

  const next = [...elements];
  const indexes = next.map((e, i) => (selected.has(e.id) ? i : -1)).filter((i) => i >= 0);
  if (move === "forward") {
    for (const i of indexes.reverse()) {
      if (i < next.length - 1 && !selected.has(next[i + 1].id)) [next[i], next[i + 1]] = [next[i + 1], next[i]];
    }
  } else {
    for (const i of indexes) {
      if (i > 0 && !selected.has(next[i - 1].id)) [next[i], next[i - 1]] = [next[i - 1], next[i]];
    }
  }
  return next;
}

export function nudgeElements(elements: FreeElement[], ids: readonly string[], dx: number, dy: number): FreeElement[] {
  return updateElements(elements, ids, (e) => ({ ...e, x: e.x + dx, y: e.y + dy }));
}

export type Alignment = "left" | "center" | "right" | "top" | "middle" | "bottom";

/** Aligns the selection to its own bounds, or a single element to the canvas. */
export function alignElements(elements: FreeElement[], ids: readonly string[], to: Alignment): FreeElement[] {
  const selected = elements.filter((e) => ids.includes(e.id));
  if (selected.length === 0) return elements;
  const box =
    selected.length === 1
      ? { left: 0, top: 0, right: CANVAS_WIDTH, bottom: CANVAS_HEIGHT }
      : {
          left: Math.min(...selected.map((e) => e.x)),
          top: Math.min(...selected.map((e) => e.y)),
          right: Math.max(...selected.map((e) => e.x + e.w)),
          bottom: Math.max(...selected.map((e) => e.y + e.h)),
        };
  return updateElements(elements, ids, (e) => {
    switch (to) {
      case "left":
        return { ...e, x: box.left };
      case "center":
        return { ...e, x: Math.round((box.left + box.right - e.w) / 2) };
      case "right":
        return { ...e, x: box.right - e.w };
      case "top":
        return { ...e, y: box.top };
      case "middle":
        return { ...e, y: Math.round((box.top + box.bottom - e.h) / 2) };
      case "bottom":
        return { ...e, y: box.bottom - e.h };
    }
  });
}
