"use client";

import * as React from "react";
import Moveable, { type OnDrag, type OnResize, type OnRotate } from "react-moveable";
import type { ThemeTokens } from "@/lib/slides/theme";
import type { FreeElement } from "@/lib/slides/free";
import { FreeHistory } from "./history";
import {
  addElement,
  duplicateElements,
  makeElement,
  nudgeElements,
  removeElements,
  updateElements,
  type NewElementKind,
} from "./free-ops";
import { FreeToolbar } from "./FreeToolbar";

interface FreeEditorProps {
  slideId: string;
  elements: FreeElement[];
  theme: ThemeTokens;
  onChange: (elements: FreeElement[]) => void;
  /** Opens the image picker for the image element at `elements.<i>.assetId`. */
  onPickImage: (path: string) => void;
  /** The rendered slide canvas (inside a SlideEditProvider). */
  children: React.ReactNode;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

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
 * Canva-style editing of a freeform slide (Task 68): click to select (Shift to add), drag,
 * resize and rotate with snapping to the canvas, safe margins and other elements,
 * double-click a text to type in it, keyboard nudges and shortcuts, undo/redo.
 */
export function FreeEditor({ slideId, elements, theme, onChange, onPickImage, children }: FreeEditorProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const moveableRef = React.useRef<Moveable>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [targets, setTargets] = React.useState<HTMLElement[]>([]);
  const [guides, setGuides] = React.useState<HTMLElement[]>([]);
  const historyRef = React.useRef(new FreeHistory());
  const pressing = React.useRef(false);
  const elementsRef = React.useRef(elements);
  elementsRef.current = elements;

  // A new slide gets its own history and an empty selection.
  React.useEffect(() => {
    historyRef.current = new FreeHistory();
    setSelected([]);
  }, [slideId]);

  // Drop ids that no longer exist (deleted, undone).
  React.useEffect(() => {
    setSelected((ids) => ids.filter((id) => elements.some((e) => e.id === id)));
  }, [elements]);

  React.useLayoutEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-free-id]"));
    setTargets(nodes.filter((n) => selected.includes(n.dataset.freeId!)));
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

  const commit = React.useCallback(
    (next: FreeElement[]) => {
      historyRef.current.record(elementsRef.current);
      onChange(next);
    },
    [onChange]
  );

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

  const add = React.useCallback(
    (kind: NewElementKind) => {
      const element = makeElement(kind);
      const next = addElement(elementsRef.current, element);
      if (!next) return false;
      commit(next);
      setSelected([element.id]);
      return true;
    },
    [commit]
  );

  const undo = React.useCallback(() => {
    const previous = historyRef.current.undo(elementsRef.current);
    if (previous) onChange(previous);
  }, [onChange]);

  const redo = React.useCallback(() => {
    const next = historyRef.current.redo(elementsRef.current);
    if (next) onChange(next);
  }, [onChange]);

  const startTextEditing = React.useCallback((node: HTMLElement) => {
    const field = node.querySelector<HTMLElement>("[contenteditable]");
    if (!field) return;
    node.dataset.freeEditing = "";
    // Next frame: after the click's own focus handling and any closing menu's focus return.
    requestAnimationFrame(() => {
      field.focus();
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      field.addEventListener("blur", () => delete node.dataset.freeEditing, { once: true });
    });
  }, []);

  // Keyboard: Delete, arrows (Shift = 10 px), Ctrl+D, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, Escape.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTyping(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const ids = selected;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (mod && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if (ids.length === 0) {
        return;
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        commit(removeElements(elementsRef.current, ids));
      } else if (event.key === "Escape") {
        setSelected([]);
      } else if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        const result = duplicateElements(elementsRef.current, ids);
        if (result) {
          commit(result.elements);
          setSelected(result.ids);
        }
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        commit(nudgeElements(elementsRef.current, ids, dx, dy));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, commit, undo, redo]);

  // Mouse events, not pointer events: Moveable's gesture layer (Gesto) tracks a drag started
  // from a pointer event with the wrong listeners, which left a stale drag open.
  function onMouseDown(event: React.MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest(".moveable-control-box")) return;
    const node = target.closest<HTMLElement>("[data-free-id]");
    if (!node) {
      setSelected([]);
      return;
    }
    if (node.dataset.freeEditing !== undefined) return; // typing inside a text
    if (event.detail === 2) {
      // Double-click, handled on the second press: the `dblclick` event can land elsewhere
      // after the first click re-rendered the selection, and the browser's own focus change
      // on mousedown would steal the caret from the text we focus.
      event.preventDefault();
      openElement(node);
      return;
    }
    const id = node.dataset.freeId!;
    if (event.shiftKey) {
      setSelected((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
      return;
    }
    if (!selected.includes(id)) {
      setSelected([id]);
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

  /** Double-click: type in a text, pick an image for an image. */
  function openElement(node: HTMLElement) {
    const index = elementsRef.current.findIndex((e) => e.id === node.dataset.freeId);
    const element = elementsRef.current[index];
    if (element?.kind === "text") startTextEditing(node);
    else if (element?.kind === "image") onPickImage(`elements.${index}.assetId`);
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
        canUndo={historyRef.current.canUndo}
        canRedo={historyRef.current.canRedo}
        onAdd={add}
        onChange={commit}
        onSelect={setSelected}
        onPickImage={(id) => onPickImage(`elements.${elements.findIndex((e) => e.id === id)}.assetId`)}
        onUndo={undo}
        onRedo={redo}
      />
      <div
        ref={wrapperRef}
        className="relative"
        data-free-editor=""
        data-testid="free-editor"
        onMouseDown={onMouseDown}
      >
        {children}
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
    </div>
  );
}
