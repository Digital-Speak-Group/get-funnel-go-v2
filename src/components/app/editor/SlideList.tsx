"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { SLIDE_TYPES, type SlideType } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { SLIDE_LIST_MESSAGES as m, SLIDE_TYPE_LABELS } from "./messages";
import type { EditorSlide } from "./validation";
import { SlideListItem } from "./SlideListItem";

interface SlideListProps {
  slides: EditorSlide[];
  theme: ThemeTokens;
  activeId: string | null;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onMoveTo: (from: number, to: number) => void;
  onAdd: (type: SlideType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Slide rail: numbered live thumbnails, dragged to reorder; move/duplicate/delete on hover,
 * focus or right-click; add at the bottom.
 */
export function SlideList({ slides, theme, activeId, onSelect, onMove, onMoveTo, onAdd, onDuplicate, onDelete }: SlideListProps) {
  const [newType, setNewType] = React.useState<SlideType>("cover");
  // A few pixels of movement before a drag starts, so a click still selects the slide.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = slides.findIndex((s) => s.id === active.id);
    const to = slides.findIndex((s) => s.id === over.id);
    if (from >= 0 && to >= 0) onMoveTo(from, to);
  }

  return (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-3 lg:sticky lg:top-4" data-testid="slide-list" aria-label={m.title}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-faint">{m.title}</h2>
        <span className="font-mono text-xs tabular-nums text-faint">{slides.length}</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
          <ol
            className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100dvh-16rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0"
            title={m.dragHint}
          >
            {slides.map((slide, index) => (
              <SlideListItem
                key={slide.id}
                slide={slide}
                index={index}
                count={slides.length}
                theme={theme}
                active={activeId === slide.id}
                onSelect={() => onSelect(slide.id)}
                onMove={(direction) => onMove(index, direction)}
                onDuplicate={() => onDuplicate(slide.id)}
                onDelete={() => onDelete(slide.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {slides.length === 0 && <p className="px-1 text-small text-faint">{m.empty}</p>}

      <div className="space-y-2 border-t border-border pt-3">
        <label htmlFor="add-slide-type" className="px-1 text-small font-medium text-foreground">
          {m.newSlide}
        </label>
        <select
          id="add-slide-type"
          data-testid="add-slide-type"
          value={newType}
          className="h-8 w-full rounded-md border border-border-strong bg-surface px-2 text-small text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          onChange={(e) => setNewType(e.target.value as SlideType)}
        >
          {SLIDE_TYPES.map((type) => (
            <option key={type} value={type}>
              {SLIDE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" className="w-full" data-testid="add-slide-submit" onClick={() => onAdd(newType)}>
          <Plus aria-hidden="true" />
          {m.add}
        </Button>
      </div>
    </aside>
  );
}
