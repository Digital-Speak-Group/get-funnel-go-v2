"use client";

import * as React from "react";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { layoutsFor } from "@/lib/slides/layouts";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { LAYOUT_MESSAGES as m } from "./messages";
import type { EditorSlide } from "./validation";

interface LayoutPickerProps {
  slide: EditorSlide;
  theme: ThemeTokens;
  onChange: (layout: string) => void;
}

/** Thumbnails of the current slide in each layout of its type; nothing for types without variants. */
export function LayoutPicker({ slide, theme, onChange }: LayoutPickerProps) {
  const layouts = layoutsFor(slide.type);
  if (layouts.length === 0) return null;
  const current = slide.layout ?? layouts[0];

  return (
    <section className="mb-4 space-y-2" aria-labelledby="layout-picker-title" data-testid="layout-picker">
      <div>
        <h3 id="layout-picker-title" className="text-sm font-medium text-foreground">{m.section}</h3>
        <p className="text-xs text-faint">{m.hint}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {layouts.map((layout) => {
          const preview = {
            id: slide.id,
            position: slide.position,
            type: slide.type,
            content: slide.content,
            layout,
          } as unknown as Slide;
          const selected = layout === current;
          return (
            <button
              key={layout}
              type="button"
              aria-pressed={selected}
              data-testid={`layout-option-${layout}`}
              onClick={() => onChange(layout)}
              className={cn(
                "group space-y-1 rounded-md p-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                selected ? "bg-primary/15" : "hover:bg-muted"
              )}
            >
              <span
                inert
                className={cn(
                  "relative block aspect-video overflow-hidden rounded border",
                  selected ? "border-primary" : "border-border"
                )}
              >
                <SlideThumbnail slide={preview} theme={theme} className="absolute inset-0 h-full w-full" />
              </span>
              <span className={cn("block truncate text-xs", selected ? "text-foreground" : "text-muted-foreground")}>
                {m.names[layout] ?? layout}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
