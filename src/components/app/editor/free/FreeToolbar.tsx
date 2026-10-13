"use client";

import * as React from "react";
import {
  Copy,
  ImagePlus,
  Layers,
  Plus,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FreeElement } from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";
import { FREE_MESSAGES as m } from "../messages";
import {
  alignElements,
  duplicateElements,
  removeElements,
  reorderElements,
  updateElements,
  type Alignment,
  type NewElementKind,
} from "./free-ops";
import { ColorPicker, IconPicker, TextControls } from "./StyleControls";

interface FreeToolbarProps {
  theme: ThemeTokens;
  elements: FreeElement[];
  selected: FreeElement[];
  canUndo: boolean;
  canRedo: boolean;
  /** False when the slide is full (60 elements). */
  onAdd: (kind: NewElementKind) => boolean;
  /** A change to record in the history and save. */
  onChange: (elements: FreeElement[]) => void;
  onSelect: (ids: string[]) => void;
  onPickImage: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
}

/** Menus keep focus where it went (often a text being typed in), not back on their button. */
const keepFocus = (event: Event) => event.preventDefault();

const ADD_KINDS: NewElementKind[] = ["text", "rect", "ellipse", "line", "image", "icon"];
const ALIGNMENTS: Alignment[] = ["left", "center", "right", "top", "middle", "bottom"];

/** Toolbar above a freeform slide: add elements, then style and arrange the selection. */
export function FreeToolbar({
  theme,
  elements,
  selected,
  canUndo,
  canRedo,
  onAdd,
  onChange,
  onSelect,
  onPickImage,
  onUndo,
  onRedo,
}: FreeToolbarProps) {
  const ids = selected.map((e) => e.id);
  const kinds = new Set(selected.map((e) => e.kind));
  const only = kinds.size === 1 ? [...kinds][0] : null;
  const first = selected[0];
  const patch = (fn: (e: FreeElement) => FreeElement) => onChange(updateElements(elements, ids, fn));

  // One line, never wrapping: a toolbar that grew on selection would shift the slide under
  // the pointer between the two clicks of a double-click.
  return (
    <div
      role="toolbar"
      aria-label={m.toolbarLabel}
      data-testid="free-toolbar"
      className="flex h-10 flex-nowrap items-center gap-1 overflow-x-auto rounded-lg border border-border bg-surface p-1 [&>*]:shrink-0"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="secondary" data-testid="free-add">
            <Plus aria-hidden="true" />
            {m.add}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onCloseAutoFocus={keepFocus}>
          {ADD_KINDS.map((kind) => (
            <DropdownMenuItem
              key={kind}
              data-testid={`free-add-${kind}`}
              onSelect={() => {
                if (!onAdd(kind)) toast.error(m.limit);
              }}
            >
              {m.addKinds[kind]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {only === "text" && first?.kind === "text" && <TextControls text={first} patch={patch} theme={theme} />}
      {only === "shape" && first?.kind === "shape" && (
        <ColorPicker
          label={m.fill}
          value={first.fill ?? "primary"}
          theme={theme}
          onChange={(fill) => patch((e) => (e.kind === "shape" ? { ...e, fill } : e))}
        />
      )}
      {only === "icon" && first?.kind === "icon" && (
        <>
          <IconPicker value={first.icon} onChange={(icon) => patch((e) => (e.kind === "icon" ? { ...e, icon } : e))} />
          <ColorPicker
            label={m.color}
            value={first.color ?? "primary"}
            theme={theme}
            onChange={(color) => patch((e) => (e.kind === "icon" ? { ...e, color } : e))}
          />
        </>
      )}
      {only === "image" && first?.kind === "image" && selected.length === 1 && (
        <>
          <Button type="button" size="sm" variant="ghost" onClick={() => onPickImage(first.id)} data-testid="free-pick-image">
            <ImagePlus aria-hidden="true" />
            {m.image}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={first.fit === "contain"}
            onClick={() => patch((e) => (e.kind === "image" ? { ...e, fit: e.fit === "contain" ? "cover" : "contain" } : e))}
          >
            {first.fit === "contain" ? m.fit.contain : m.fit.cover}
          </Button>
        </>
      )}

      {selected.length > 0 && (
        <>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" variant="ghost" data-testid="free-arrange">
                <Layers aria-hidden="true" />
                {m.arrange}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onCloseAutoFocus={keepFocus}>
              <DropdownMenuItem onSelect={() => onChange(reorderElements(elements, ids, "front"))}>{m.front}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChange(reorderElements(elements, ids, "forward"))}>{m.forward}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChange(reorderElements(elements, ids, "backward"))}>{m.backward}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onChange(reorderElements(elements, ids, "back"))}>{m.back}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {ALIGNMENTS.map((to) => (
                <DropdownMenuItem key={to} onSelect={() => onChange(alignElements(elements, ids, to))}>
                  {m.alignSelection[to]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={m.duplicate}
            title={`${m.duplicate} (Ctrl+D)`}
            onClick={() => {
              const result = duplicateElements(elements, ids);
              if (!result) return void toast.error(m.limit);
              onChange(result.elements);
              onSelect(result.ids);
            }}
          >
            <Copy aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={m.remove}
            title={`${m.remove} (Suppr)`}
            data-testid="free-remove"
            onClick={() => onChange(removeElements(elements, ids))}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </>
      )}

      <span className="ml-auto hidden text-small text-faint xl:inline">{selected.length === 0 ? m.hint : null}</span>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={m.undo} title={`${m.undo} (Ctrl+Z)`} disabled={!canUndo} onClick={onUndo}>
        <Undo2 aria-hidden="true" />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label={m.redo} title={`${m.redo} (Ctrl+Shift+Z)`} disabled={!canRedo} onClick={onRedo}>
        <Redo2 aria-hidden="true" />
      </Button>
    </div>
  );
}
