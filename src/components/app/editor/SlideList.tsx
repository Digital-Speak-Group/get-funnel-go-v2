"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLIDE_TYPES, type SlideType } from "@/lib/slides/schema";
import { SLIDE_TYPE_LABELS } from "./messages";
import { cn } from "@/lib/utils";
import type { EditorSlide } from "./validation";

interface SlideListProps {
  slides: EditorSlide[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onAdd: (type: SlideType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function IconBtn({
  label,
  testId,
  disabled,
  onClick,
  children,
}: {
  label: string;
  testId: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={testId}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500"
    >
      {children}
    </button>
  );
}

export function SlideList({
  slides,
  activeId,
  onSelect,
  onMove,
  onAdd,
  onDuplicate,
  onDelete,
}: SlideListProps) {
  const [newType, setNewType] = React.useState<SlideType>("cover");

  return (
    <aside
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
      data-testid="slide-list"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Slides
        </h2>
        <span className="text-xs text-zinc-500">{slides.length}</span>
      </div>

      <ol className="space-y-1">
        {slides.map((slide, index) => (
          <li
            key={slide.id}
            data-testid="slide-item"
            data-slide-type={slide.type}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5",
              activeId === slide.id
                ? "bg-violet-600/20 ring-1 ring-violet-500"
                : "hover:bg-zinc-800/60"
            )}
            onClick={() => onSelect(slide.id)}
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              aria-current={activeId === slide.id ? "true" : undefined}
            >
              <span className="mr-1 text-xs text-zinc-500">{index + 1}.</span>
              <span className="text-sm text-white">
                {SLIDE_TYPE_LABELS[slide.type]}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconBtn
                label={`Monter le slide ${index + 1}`}
                testId={`slide-up-${index}`}
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label={`Descendre le slide ${index + 1}`}
                testId={`slide-down-${index}`}
                disabled={index === slides.length - 1}
                onClick={() => onMove(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label={`Dupliquer le slide ${index + 1}`}
                testId={`slide-dup-${index}`}
                onClick={() => onDuplicate(slide.id)}
              >
                <Copy className="h-4 w-4" />
              </IconBtn>
              <IconBtn
                label={`Supprimer le slide ${index + 1}`}
                testId={`slide-del-${index}`}
                disabled={slides.length <= 1}
                onClick={() => onDelete(slide.id)}
              >
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            </div>
          </li>
        ))}
      </ol>

      {slides.length === 0 && (
        <p className="text-sm text-zinc-500">
          Aucun slide. Ajoutez le premier pour commencer.
        </p>
      )}

      <div className="space-y-2 border-t border-zinc-800 pt-3">
        <label
          htmlFor="add-slide-type"
          className="text-sm font-medium text-zinc-300"
        >
          Nouveau slide
        </label>
        <select
          id="add-slide-type"
          data-testid="add-slide-type"
          value={newType}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white outline-none focus:border-violet-500"
          onChange={(e) => setNewType(e.target.value as SlideType)}
        >
          {SLIDE_TYPES.map((type) => (
            <option key={type} value={type}>
              {SLIDE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          className="w-full gap-2"
          data-testid="add-slide-submit"
          onClick={() => onAdd(newType)}
        >
          <Plus className="h-4 w-4" /> Ajouter un slide
        </Button>
      </div>
    </aside>
  );
}
