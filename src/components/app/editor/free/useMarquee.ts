"use client";

import * as React from "react";

export interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Below this drag distance (screen px) a press on the empty canvas is a plain click. */
const CLICK_TOLERANCE = 4;

/**
 * Box selection on the freeform canvas (Task 70): press on an empty area and drag; every
 * element the box touches is picked. `rect` is the box in the wrapper's own pixels, for drawing.
 */
export function useMarquee(
  wrapperRef: React.RefObject<HTMLElement | null>,
  onSelect: (ids: string[], additive: boolean) => void
) {
  const [rect, setRect] = React.useState<MarqueeRect | null>(null);
  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;

  const start = React.useCallback(
    (event: React.MouseEvent) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const sx = event.clientX;
      const sy = event.clientY;
      const additive = event.shiftKey;
      const bounds = (e: MouseEvent) => ({
        left: Math.min(sx, e.clientX),
        top: Math.min(sy, e.clientY),
        right: Math.max(sx, e.clientX),
        bottom: Math.max(sy, e.clientY),
      });

      function onMove(e: MouseEvent) {
        const b = bounds(e);
        const origin = wrapper!.getBoundingClientRect();
        // The wrapper may be scrolled (zoomed canvas): its children are placed in scrolled space.
        setRect({
          x: b.left - origin.left + wrapper!.scrollLeft,
          y: b.top - origin.top + wrapper!.scrollTop,
          w: b.right - b.left,
          h: b.bottom - b.top,
        });
      }
      function onUp(e: MouseEvent) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setRect(null);
        const b = bounds(e);
        if (b.right - b.left < CLICK_TOLERANCE && b.bottom - b.top < CLICK_TOLERANCE) {
          if (!additive) onSelectRef.current([], false);
          return;
        }
        const hits = Array.from(wrapper!.querySelectorAll<HTMLElement>("[data-free-id]")).filter((node) => {
          const r = node.getBoundingClientRect();
          return r.right >= b.left && r.left <= b.right && r.bottom >= b.top && r.top <= b.bottom;
        });
        onSelectRef.current(
          hits.map((n) => n.dataset.freeId!),
          additive
        );
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [wrapperRef]
  );

  return { rect, start };
}
