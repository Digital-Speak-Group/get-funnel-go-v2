# Freeform slides ("Libre") — spec for Task 68

> Status: **approved 2026-10-12** — schema change (`free` type) and `react-moveable` approved; theme colours only in V1; "Convertir en libre" included in the first version.

## Goal

Canva-style control for the slides where the structured layouts are not enough: place any text, shape or image anywhere on the 1920×1080 canvas, drag, resize, rotate, layer, align, undo. Structured slides stay the default — AI generation, templates and automatic layouts keep working — and any slide can be **converted** to a freeform one when the user wants total control.

## What the user gets

- A new slide type **Libre** in "Nouveau slide", starting empty or from a few presets (title + text, title + image, three columns).
- **"Convertir en libre"** on any structured slide: the slide becomes freeform with its texts, cards and images placed exactly where they were. One-way (the original stays in version history).
- On the canvas, for a freeform slide:
  - Click to select an element; Shift-click or drag a box to select several.
  - Drag to move, handles to resize, top handle to rotate; snapping guides to the slide's edges, centre, safe margins (96 px) and other elements; arrow keys nudge 1 px (Shift: 10 px).
  - Double-click a text to type in it (same inline editing as structured slides).
  - Toolbar for the selection: text style (Titre / Sous-titre / Texte / Légende), alignment, colour, bold, layer order (avant / arrière), duplicate, delete, align/distribute several elements.
  - "Ajouter": texte, forme (rectangle, cercle, ligne), image (existing upload flow), icône (the slide icon set).
  - Undo / redo (Ctrl+Z / Ctrl+Shift+Z) for the editing session.
- Presenter, audience view, thumbnails, PDF and PowerPoint render freeform slides like any other slide (they are plain absolutely-positioned HTML).

## What a freeform slide gives up

- **No AI regeneration** of that slide ("Regénérer" is hidden). AI-generated decks stay structured.
- **No automatic layout variants** (the layout picker is hidden): positions are the user's.
- **Theme still applies**: colours are stored as theme roles (`text`, `muted`, `primary`, `accent`, `surface`, `danger`, `success`), fonts as `display` / `body`, so switching the deck theme recolours freeform slides too. No free hex colours in V1 (keeps every slide on-brand and readable).

## Data model

No database migration: `slides.type` is text and `content` is JSON. The change is in `src/lib/slides/schema.ts` (new `free` type in `SLIDE_TYPES` and its content schema), validated like every other type.

```ts
free: {
  elements: Element[]            // max 60, drawn in array order (last = on top)
}

Element = {
  id: string                     // uuid, stable across edits (selection, undo)
  x: number; y: number           // px in the 1920×1080 design space
  w: number; h: number           // px, min 8
  rotation?: number              // degrees, -180..180
  opacity?: number               // 0.1..1
} & (
  | { kind: "text";  text: string /* ≤ 600 */; style: "title" | "subtitle" | "body" | "caption";
      align?: "left" | "center" | "right"; color?: ThemeRole; weight?: "regular" | "bold" }
  | { kind: "shape"; shape: "rect" | "ellipse" | "line"; fill?: ThemeRole; stroke?: ThemeRole;
      radius?: number }
  | { kind: "image"; assetId?: string; fit?: "cover" | "contain"; radius?: number }
  | { kind: "icon";  icon: SlideIconName; color?: ThemeRole }
)
```

- Text sizes come from the four styles (theme fonts and a fixed scale), so text stays consistent across slides; the box width wraps it. A text may carry a `size` override (px): "Convertir en libre" sets it to keep the original look, and choosing a style in the toolbar clears it.
- Elements may extend past the safe margins but are clamped to the canvas.

## Rendering and editing — how it's built

- **Renderer** (`src/components/slides/types/free.tsx`): each element is an absolutely positioned `<div>` with `transform: rotate()`; texts use `EditableText`, images `EditableImage`. Same component everywhere, so presenter/audience/PDF/PPTX need no change.
- **Editor**: a selection layer over the canvas using **`react-moveable`** (MIT, ~70 kB gzipped, maintained, used by many web editors) for drag / resize / rotate handles, snapping guides and multi-select groups. Handles are drawn in screen space, so they stay usable at any canvas zoom. Selection, history (undo/redo, last 50 steps) and keyboard shortcuts live in a small editor store; each change goes through the existing `updateActive` → validation → autosave.
- **Convert to freeform**: render the structured slide off-screen at 1920×1080 and read the boxes and computed styles of its editable texts (`data-edit-path`), images (`data-edit-image`) and item cards (`data-edit-item`) — the markup added in Tasks 64–67 — into text, image and rect elements. Decorations that aren't content (glows, grids, connector lines) are approximated or dropped; the user sees the result before confirming.

## Alternatives considered

- **Canvas engines (Konva, Fabric)**: draw to `<canvas>`, so text is not HTML — breaks inline editing, accessibility and the "same component everywhere" rule; PDF export would rasterise text. Rejected.
- **Hand-built drag/resize**: no dependency, but rotation + snapping + multi-select is weeks of fiddly work that `react-moveable` already does well.
- **Free hex colours**: deferred; easy to add later as an extra `color: { hex }` option if users ask.

## Status

Built 2026-10-13 (all five steps). See Task 68 in `tasks/todo.md` for files, tests and known limits.

## Plan (each step shippable, behind the normal tests)

1. Schema + renderer for `free` (read-only rendering, PDF/PPTX check) — S
2. Editor selection, move/resize/rotate, snapping, keyboard nudges, undo/redo — L
3. Element toolbar (style, colour, align, layers, duplicate, delete) + "Ajouter" menu — M
4. "Convertir en libre" from structured slides — M
5. E2E: create, move, resize, rotate, undo, reload; convert a template slide; export — S

Rough total: 1.5–2 weeks of focused work.

## Decisions needed

1. Approve the **schema change** (new `free` slide type as above).
2. Approve the **dependency** `react-moveable`.
3. Theme-only colours in V1 (recommended) vs free hex colours from day one.
4. Include "Convertir en libre" in the first version, or start with empty/preset freeform slides only.
