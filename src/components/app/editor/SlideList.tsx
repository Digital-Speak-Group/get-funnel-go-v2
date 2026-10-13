"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { SLIDE_TYPES, type Slide, type SlideType } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { SLIDE_LIST_MESSAGES as m, SLIDE_TYPE_LABELS } from "./messages";
import type { EditorSlide } from "./validation";
import { findPlaceholders } from "./placeholders";
import { PlaceholderBadge } from "./PlaceholderHints";

interface SlideListProps {
  slides: EditorSlide[];
  theme: ThemeTokens;
  activeId: string | null;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAdd: (type: SlideType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function IconBtn({ label, testId, disabled, onClick, children }: { label: string; testId: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      disabled={disabled}
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

/** Slide rail: numbered live thumbnails; move/duplicate/delete on hover or focus; add at the bottom. */
export function SlideList({ slides, theme, activeId, onSelect, onMove, onAdd, onDuplicate, onDelete }: SlideListProps) {
  const [newType, setNewType] = React.useState<SlideType>("cover");

  return (
    <aside className="space-y-3 rounded-lg border border-border bg-surface p-3 lg:sticky lg:top-4" data-testid="slide-list" aria-label={m.title}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-faint">{m.title}</h2>
        <span className="font-mono text-xs tabular-nums text-faint">{slides.length}</span>
      </div>

      <ol className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100dvh-16rem)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
        {slides.map((slide, index) => {
          const active = activeId === slide.id;
          return (
            <li
              key={slide.id}
              data-testid="slide-item"
              data-slide-type={slide.type}
              className="group relative w-36 shrink-0 cursor-pointer lg:w-auto"
              onClick={() => onSelect(slide.id)}
            >
              <div className="flex gap-2">
                <span className={cn("w-5 shrink-0 pt-1 text-right font-mono text-xs tabular-nums", active ? "text-brand" : "text-faint")}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-md border bg-surface-2 transition-colors duration-150",
                      active ? "border-primary ring-1 ring-primary" : "border-border group-hover:border-border-strong"
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
                <IconBtn label={`Monter le slide ${index + 1}`} testId={`slide-up-${index}`} disabled={index === 0} onClick={() => onMove(index, -1)}>
                  <ArrowUp />
                </IconBtn>
                <IconBtn label={`Descendre le slide ${index + 1}`} testId={`slide-down-${index}`} disabled={index === slides.length - 1} onClick={() => onMove(index, 1)}>
                  <ArrowDown />
                </IconBtn>
                <IconBtn label={`Dupliquer le slide ${index + 1}`} testId={`slide-dup-${index}`} onClick={() => onDuplicate(slide.id)}>
                  <Copy />
                </IconBtn>
                <IconBtn label={`Supprimer le slide ${index + 1}`} testId={`slide-del-${index}`} disabled={slides.length <= 1} onClick={() => onDelete(slide.id)}>
                  <Trash2 />
                </IconBtn>
              </div>
            </li>
          );
        })}
      </ol>

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
