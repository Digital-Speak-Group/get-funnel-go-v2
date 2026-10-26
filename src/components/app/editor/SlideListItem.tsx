"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { SLIDE_LIST_MESSAGES as m, SLIDE_TYPE_LABELS } from "./messages";
import type { EditorSlide } from "./validation";
import { findPlaceholders } from "./placeholders";
import { PlaceholderBadge } from "./PlaceholderHints";

function IconBtn({ label, testId, disabled, onClick, children }: { label: string; testId: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      disabled={disabled}
      // Not a drag start: the row's pointer listeners would otherwise pick it up.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex size-6 items-center justify-center rounded text-muted-foreground outline-none hover:bg-surface-3 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}

const asSlide = (slide: EditorSlide) => ({ ...slide, notes: undefined, script: undefined, cue: undefined }) as unknown as Slide;

interface SlideListItemProps {
  slide: EditorSlide;
  index: number;
  count: number;
  theme: ThemeTokens;
  active: boolean;
  onSelect: () => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * One thumbnail of the slide rail: drag it to reorder (pointer; Task 72), hover/focus buttons
 * and a right-click menu for move/duplicate/delete (the buttons are the keyboard path).
 */
export function SlideListItem({ slide, index, count, theme, active, onSelect, onMove, onDuplicate, onDelete }: SlideListItemProps) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: slide.id });
  const n = index + 1;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li
          ref={setNodeRef}
          {...listeners}
          data-testid="slide-item"
          data-slide-type={slide.type}
          style={{ transform: CSS.Translate.toString(transform), transition }}
          className={cn("group relative w-36 shrink-0 cursor-pointer touch-manipulation lg:w-auto", isDragging && "z-10 opacity-80")}
          onClick={onSelect}
        >
          <div className="flex gap-2">
            <span className={cn("w-5 shrink-0 pt-1 text-right font-mono text-xs tabular-nums", active ? "text-brand" : "text-faint")}>{n}</span>
            <div className="min-w-0 flex-1 space-y-1">
              <div
                className={cn(
                  "relative aspect-video overflow-hidden rounded-md border bg-surface-2 transition-colors duration-150",
                  active ? "border-primary ring-1 ring-primary" : "border-border group-hover:border-border-strong",
                  isDragging && "shadow-pop"
                )}
              >
                <div inert aria-hidden="true" className="size-full">
                  <SlideThumbnail slide={asSlide(slide)} theme={theme} className="size-full" />
                </div>
              </div>
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-1 rounded text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-current={active ? "true" : undefined}
              >
                <span className={cn("truncate", active ? "text-foreground" : "text-muted-foreground")}>{SLIDE_TYPE_LABELS[slide.type]}</span>
                <PlaceholderBadge count={findPlaceholders(slide.content).length} />
              </button>
            </div>
          </div>
          <div className="absolute right-1 top-1 flex items-center gap-0.5 rounded-md border border-border bg-surface/95 p-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
            <IconBtn label={m.moveUp(n)} testId={`slide-up-${index}`} disabled={index === 0} onClick={() => onMove(-1)}>
              <ArrowUp />
            </IconBtn>
            <IconBtn label={m.moveDown(n)} testId={`slide-down-${index}`} disabled={index === count - 1} onClick={() => onMove(1)}>
              <ArrowDown />
            </IconBtn>
            <IconBtn label={m.duplicate(n)} testId={`slide-dup-${index}`} onClick={onDuplicate}>
              <Copy />
            </IconBtn>
            <IconBtn label={m.remove(n)} testId={`slide-del-${index}`} disabled={count <= 1} onClick={onDelete}>
              <Trash2 />
            </IconBtn>
          </div>
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={index === 0} onSelect={() => onMove(-1)}>
          <ArrowUp aria-hidden="true" />
          {m.menu.up}
        </ContextMenuItem>
        <ContextMenuItem disabled={index === count - 1} onSelect={() => onMove(1)}>
          <ArrowDown aria-hidden="true" />
          {m.menu.down}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onDuplicate}>
          <Copy aria-hidden="true" />
          {m.menu.duplicate}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={count <= 1} onSelect={onDelete}>
          <Trash2 aria-hidden="true" />
          {m.menu.remove}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
