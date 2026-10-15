"use client";

import * as React from "react";
import Moveable, { type OnDrag, type OnResize, type OnRotate } from "react-moveable";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import type { FreeElement } from "@/lib/slides/free";
import {
  addElement,
  makeElement,
  makeVideoElement,
  updateElements,
  type NewElementKind,
} from "./free-ops";
import { expandToGroups } from "./selection-ops";
import { FreeToolbar } from "./FreeToolbar";
import { FreeContextMenu } from "./FreeContextMenu";
import { useFreeKeyboard } from "./useFreeKeyboard";
import { useFreeActions, type FreeCommit } from "./useFreeActions";
import { useMarquee } from "./useMarquee";

interface FreeEditorProps {
  slideId: string;
  elements: FreeElement[];
  theme: ThemeTokens;
  onChange: FreeCommit;
  /** Opens the image picker for the image element at `elements.<i>.assetId`. */
  onPickImage: (path: string) => void;
  /** The rendered slide canvas (inside a SlideEditProvider). */
  children: React.ReactNode;
  /** Classes of the scrolling box around the canvas (zoom, Task 71). */
  viewportClassName?: string;
}

/** Element box read back from the DOM after Moveable changed its inline styles. */
function readBox(node: HTMLElement) {
  const rotation = /rotate\((-?[\d.]+)deg\)/.exec(node.style.transform)?.[1];
  return {
    x: Math.round(parseFloat(node.style.left)),
    y: Math.round(parseFloat(node.style.top)),
    w: Math.max(8, Math.round(parseFloat(node.style.width))),
    h: Math.max(8, Math.round(parseFloat(node.style.height))),
    rotation: rotation ? Math.round(Number(rotation) * 10) / 10 : undefined,
  };
}

/**
 * Canva-style editing of a freeform slide (Tasks 68, 70): click to select (Shift to add, a
 * group selects as one), drag a box on the empty canvas to select several, drag, resize and
 * rotate with snapping to the canvas, safe margins and other elements, double-click a text to
 * type in it, right-click menu, keyboard shortcuts. Locked elements get no handles. Undo/redo
 * is the editor's.
 */
export function FreeEditor({ slideId, elements, theme, onChange, onPickImage, children, viewportClassName }: FreeEditorProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const moveableRef = React.useRef<Moveable>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [targets, setTargets] = React.useState<HTMLElement[]>([]);
  const [guides, setGuides] = React.useState<HTMLElement[]>([]);
  const pressing = React.useRef(false);
  const elementsRef = React.useRef(elements);
  elementsRef.current = elements;

  // A new slide starts with an empty selection.
  React.useEffect(() => setSelected([]), [slideId]);

  // Drop ids that no longer exist (deleted, undone).
  React.useEffect(() => {
    setSelected((ids) => ids.filter((id) => elements.some((e) => e.id === id)));
  }, [elements]);

  React.useLayoutEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-free-id]"));
    const locked = new Set(elements.filter((e) => e.locked).map((e) => e.id));
    // Selected locked elements show a dashed outline (CSS) instead of handles.
    for (const node of nodes) {
      const id = node.dataset.freeId!;
      node.toggleAttribute("data-free-selected", selected.includes(id));
      node.toggleAttribute("data-free-locked", locked.has(id));
    }
    setTargets(nodes.filter((n) => selected.includes(n.dataset.freeId!) && !locked.has(n.dataset.freeId!)));
    const canvas = root.querySelector<HTMLElement>("[data-free-canvas]");
    const safe = root.querySelector<HTMLElement>("[data-free-safe]");
    setGuides([
      ...(canvas ? [canvas] : []),
      ...(safe ? [safe] : []),
      ...nodes.filter((n) => !selected.includes(n.dataset.freeId!)),
    ]);
  }, [selected, elements]);

  // Re-measure the handles after React re-rendered the committed positions.
  React.useEffect(() => {
    moveableRef.current?.updateRect();
  }, [elements, targets]);

  // Each change is one step of the editor's undo history (useEditorState).
  const commit = onChange;

  /** Writes the boxes Moveable left in the DOM back into the slide content. */
  const commitTargets = React.useCallback(
    (nodes: (HTMLElement | SVGElement)[]) => {
      const boxes = new Map(
        nodes.filter((n): n is HTMLElement => n instanceof HTMLElement).map((n) => [n.dataset.freeId!, readBox(n)])
      );
      commit(
        updateElements(elementsRef.current, [...boxes.keys()], (e) => {
          const box = boxes.get(e.id)!;
          return { ...e, x: box.x, y: box.y, w: box.w, h: box.h, rotation: box.rotation };
        })
      );
    },
    [commit]
  );

  // Panel of a chart's data or a video's link (double-click opens it), see FreeToolbar.
  const [panel, setPanel] = React.useState<string | null>(null);

  const add = React.useCallback(
    (kind: NewElementKind | FreeElement) => {
      const element = typeof kind === "string" ? makeElement(kind) : kind;
      const next = addElement(elementsRef.current, element);
      if (!next) return false;
      commit(next);
      setSelected([element.id]);
      return true;
    },
    [commit]
  );

  const startTextEditing = React.useCallback((node: HTMLElement, at?: { x: number; y: number }) => {
    node.dataset.freeEditing = "";
    // A table: the cell under the pointer (its cells take the pointer once editing is on).
    const hit = at && document.elementFromPoint(at.x, at.y)?.closest<HTMLElement>("[contenteditable]");
    const field = hit && node.contains(hit) ? hit : node.querySelector<HTMLElement>("[contenteditable]");
    if (!field) {
      delete node.dataset.freeEditing;
      return;
    }
    // Next frame: after the click's own focus handling and any closing menu's focus return.
    requestAnimationFrame(() => {
      field.focus();
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      // Typing ends when the focus leaves the element (Tab between table cells keeps it).
      const end = (event: FocusEvent) => {
        if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
        delete node.dataset.freeEditing;
        node.removeEventListener("focusout", end);
      };
      node.addEventListener("focusout", end);
    });
  }, []);

  const actions = useFreeActions({ slideId, elementsRef, selected, setSelected, commit });
  useFreeKeyboard(actions, () => setSelected([]));

  const marquee = useMarquee(wrapperRef, (ids, additive) => {
    const unlocked = ids.filter((id) => !elementsRef.current.find((e) => e.id === id)?.locked);
    const picked = expandToGroups(elementsRef.current, unlocked);
    setSelected((current) => (additive ? [...new Set([...current, ...picked])] : picked));
  });

  // Mouse events, not pointer events: Moveable's gesture layer (Gesto) tracks a drag started
  // from a pointer event with the wrong listeners, which left a stale drag open.
  function onMouseDown(event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest(".moveable-control-box")) return;
    const node = target.closest<HTMLElement>("[data-free-id]");
    if (event.button === 2) {
      // Right-click: the menu acts on what is under the pointer.
      const id = node?.dataset.freeId;
      if (!id) setSelected([]);
      else if (!selected.includes(id)) actions.select([id]);
      return;
    }
    if (event.button !== 0) return;
    if (!node) {
      if (target.closest("[data-free-canvas]")) marquee.start(event);
      else setSelected([]);
      return;
    }
    if (node.dataset.freeEditing !== undefined) return; // typing inside a text
    if (event.detail === 2) {
      // Double-click, handled on the second press: the `dblclick` event can land elsewhere
      // after the first click re-rendered the selection, and the browser's own focus change
      // on mousedown would steal the caret from the text we focus.
      event.preventDefault();
      openElement(node, { x: event.clientX, y: event.clientY });
      return;
    }
    const id = node.dataset.freeId!;
    const unit = expandToGroups(elementsRef.current, [id]);
    if (event.shiftKey) {
      setSelected((ids) => (ids.includes(id) ? ids.filter((i) => !unit.includes(i)) : [...new Set([...ids, ...unit])]));
      return;
    }
    if (!selected.includes(id)) {
      setSelected(unit);
      if (elementsRef.current.find((e) => e.id === id)?.locked) return;
      // Start dragging right away instead of needing a second press — but only while the
      // button is still down: a quick click must not leave a drag open with a stale start point.
      const native = event.nativeEvent;
      pressing.current = true;
      window.addEventListener("mouseup", () => (pressing.current = false), { once: true });
      void moveableRef.current?.waitToChangeTarget().then(() => {
        if (pressing.current) moveableRef.current?.dragStart(native);
      });
    }
  }

  /**
   * Double-click: type in a text (or the table cell under the pointer), pick an image, open a
   * chart's data or a video's link.
   */
  function openElement(node: HTMLElement, at: { x: number; y: number }) {
    const index = elementsRef.current.findIndex((e) => e.id === node.dataset.freeId);
    const element = elementsRef.current[index];
    if (element?.kind === "text") startTextEditing(node);
    else if (element?.kind === "table") startTextEditing(node, at);
    else if (element?.kind === "image") onPickImage(`elements.${index}.assetId`);
    else if (element?.kind === "chart" || element?.kind === "video") setPanel(element.id);
  }

  const setPos = (target: HTMLElement | SVGElement, left: number, top: number) => {
    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
  };
  const onDrag = ({ target, left, top }: OnDrag) => setPos(target, left, top);
  const onResize = ({ target, width, height, drag }: OnResize) => {
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    setPos(target, drag.left, drag.top);
  };
  const onRotate = ({ target, rotation, drag }: OnRotate) => {
    target.style.transform = `rotate(${rotation}deg)`;
    setPos(target, drag.left, drag.top);
  };

  const selectedElements = elements.filter((e) => selected.includes(e.id));

  return (
    <div className="space-y-2">
      <FreeToolbar
        theme={theme}
        elements={elements}
        selected={selectedElements}
        actions={actions}
        onAdd={add}
        onChange={commit}
        onPickImage={(id) => onPickImage(`elements.${elements.findIndex((e) => e.id === id)}.assetId`)}
        panel={panel}
        onPanelChange={setPanel}
        onAddVideo={(video) => add(makeVideoElement(video))}
      />
      <FreeContextMenu actions={actions}>
        <div
          ref={wrapperRef}
          className={cn("relative", viewportClassName)}
          data-free-editor=""
          data-testid="free-editor"
          onMouseDown={onMouseDown}
        >
          {children}
          {marquee.rect && (
            <div
              aria-hidden="true"
              data-testid="free-marquee"
              className="pointer-events-none absolute z-10 rounded-sm border border-primary bg-primary/10"
              style={{ left: marquee.rect.x, top: marquee.rect.y, width: marquee.rect.w, height: marquee.rect.h }}
            />
          )}
          <Moveable
            ref={moveableRef}
            target={targets}
            draggable
            resizable
            rotatable
            snappable
            origin={false}
            throttleRotate={0}
            snapRotationDegrees={[0, 45, 90, 135, 180, 225, 270, 315]}
            snapThreshold={6}
            snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
            elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
            elementGuidelines={guides}
            onDrag={onDrag}
            onDragEnd={({ target, isDrag }) => isDrag && commitTargets([target])}
            onResize={onResize}
            onResizeEnd={({ target, isDrag }) => isDrag && commitTargets([target])}
            onRotate={onRotate}
            onRotateEnd={({ target, isDrag }) => isDrag && commitTargets([target])}
            onDragGroup={({ events }) => events.forEach(onDrag)}
            onDragGroupEnd={({ targets: nodes, isDrag }) => isDrag && commitTargets(nodes)}
            onResizeGroup={({ events }) => events.forEach(onResize)}
            onResizeGroupEnd={({ targets: nodes, isDrag }) => isDrag && commitTargets(nodes)}
            onRotateGroup={({ events }) => events.forEach(onRotate)}
            onRotateGroupEnd={({ targets: nodes, isDrag }) => isDrag && commitTargets(nodes)}
          />
        </div>
      </FreeContextMenu>
    </div>
  );
}
