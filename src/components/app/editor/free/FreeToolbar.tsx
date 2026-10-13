"use client";

import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlideIcon } from "@/components/slides/icons";
import { SLIDE_ICON_NAMES } from "@/lib/slides/icons";
import { TEXT_STYLES, THEME_ROLES, type FreeElement, type FreeText, type ThemeRole } from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
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

function TextControls({
  text,
  patch,
  theme,
}: {
  text: FreeText;
  patch: (fn: (e: FreeElement) => FreeElement) => void;
  theme: ThemeTokens;
}) {
  const setText = (fn: (t: FreeText) => FreeText) => patch((e) => (e.kind === "text" ? fn(e) : e));
  const align = text.align ?? "left";
  return (
    <>
      <Select value={text.style} onValueChange={(style) => setText((t) => ({ ...t, style: style as FreeText["style"], size: undefined }))}>
        <SelectTrigger className="h-8 w-32" aria-label={m.textStyle} data-testid="free-text-style">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TEXT_STYLES.map((style) => (
            <SelectItem key={style} value={style}>
              {m.textStyles[style]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(["left", "center", "right"] as const).map((value) => {
        const Icon = value === "left" ? AlignLeft : value === "center" ? AlignCenter : AlignRight;
        return (
          <Button
            key={value}
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={m.align[value]}
            aria-pressed={align === value}
            className={cn(align === value && "bg-surface-3 text-foreground")}
            onClick={() => setText((t) => ({ ...t, align: value }))}
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label={m.bold}
        aria-pressed={text.weight === "bold"}
        className={cn(text.weight === "bold" && "bg-surface-3 text-foreground")}
        onClick={() => setText((t) => ({ ...t, weight: t.weight === "bold" ? undefined : "bold" }))}
      >
        <Bold aria-hidden="true" />
      </Button>
      <ColorPicker
        label={m.color}
        value={text.color ?? (text.style === "caption" ? "muted" : "text")}
        theme={theme}
        onChange={(color) => setText((t) => ({ ...t, color }))}
      />
    </>
  );
}

const roleColor = (theme: ThemeTokens, role: ThemeRole) => theme.color[role];

function ColorPicker({
  label,
  value,
  theme,
  onChange,
}: {
  label: string;
  value: ThemeRole;
  theme: ThemeTokens;
  onChange: (role: ThemeRole) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label={`${label} : ${m.roles[value]}`} data-testid="free-color">
          {/* Swatch of the deck theme's own colour: the dynamic value is the point here. */}
          <span className="size-4 rounded-full border border-border-strong" style={{ background: roleColor(theme, value) }} aria-hidden="true" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-4 gap-1" role="group" aria-label={label}>
          {THEME_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              aria-label={m.roles[role]}
              aria-pressed={role === value}
              title={m.roles[role]}
              onClick={() => onChange(role)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring outline-none",
                role === value && "bg-surface-3 text-foreground"
              )}
            >
              <span className="size-6 rounded-full border border-border-strong" style={{ background: roleColor(theme, role) }} />
              {m.roles[role]}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (icon: (typeof SLIDE_ICON_NAMES)[number]) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" aria-label={m.icon}>
          <SlideIcon name={value} size={16} />
          {m.icon}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-72 overflow-y-auto p-2">
        <div className="grid grid-cols-7 gap-1" role="group" aria-label={m.icon}>
          {SLIDE_ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              aria-label={name}
              aria-pressed={name === value}
              title={name}
              onClick={() => onChange(name)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none",
                name === value && "bg-surface-3 text-foreground"
              )}
            >
              <SlideIcon name={name} size={18} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
