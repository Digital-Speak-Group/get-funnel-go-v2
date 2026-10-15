"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CANVAS_MESSAGES as m } from "./messages";

/** Zoom relative to "fit" (the stage's width): 1 = fit. */
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;

export const clampZoom = (zoom: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom * 100) / 100));

/**
 * Canvas zoom (Task 71): buttons, Ctrl+wheel over the stage. The level is shown as the slide's
 * real size (1920 px = 100 %), like design tools do; clicking it goes back to fit.
 */
export function useCanvasZoom(
  stageRef: React.RefObject<HTMLElement | null>,
  canvasRef: React.RefObject<HTMLElement | null>,
  /** Changes when the stage mounts (it is absent while the deck has no slide). */
  stageKey: string | undefined
) {
  const [zoom, setZoom] = React.useState(1);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const measure = () => setWidth(canvas.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    // Ctrl+wheel zooms the slide, not the page (needs a non-passive listener).
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      setZoom((z) => clampZoom(event.deltaY < 0 ? z * 1.1 : z / 1.1));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      observer.disconnect();
      stage.removeEventListener("wheel", onWheel);
    };
  }, [stageRef, canvasRef, stageKey]);

  return {
    zoom,
    percent: Math.round((width * 100) / 1920),
    zoomIn: () => setZoom((z) => clampZoom(z * ZOOM_STEP)),
    zoomOut: () => setZoom((z) => clampZoom(z / ZOOM_STEP)),
    fit: () => setZoom(1),
  };
}

export function ZoomControl({ zoom }: { zoom: ReturnType<typeof useCanvasZoom> }) {
  return (
    <div className="flex items-center rounded-md border border-border bg-surface" data-testid="canvas-zoom">
      <Button type="button" variant="ghost" size="icon-sm" aria-label={m.zoomOut} title={m.zoomOut} disabled={zoom.zoom <= ZOOM_MIN} onClick={zoom.zoomOut}>
        <Minus aria-hidden="true" />
      </Button>
      <button
        type="button"
        onClick={zoom.fit}
        title={m.zoomFit}
        aria-label={m.zoomLabel(zoom.percent)}
        className="min-w-12 rounded px-1 text-center font-mono text-xs tabular-nums text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        data-testid="canvas-zoom-value"
      >
        {zoom.percent}%
      </button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={m.zoomIn} title={m.zoomIn} disabled={zoom.zoom >= ZOOM_MAX} onClick={zoom.zoomIn}>
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
