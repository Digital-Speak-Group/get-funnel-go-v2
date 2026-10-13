"use client";

import * as React from "react";

import { AlignCenter, AlignLeft, AlignRight, Bold } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlideIcon } from "@/components/slides/icons";
import { SLIDE_ICON_NAMES } from "@/lib/slides/icons";
import { TEXT_STYLES, THEME_ROLES, type FreeElement, type FreeText, type ThemeRole } from "@/lib/slides/free";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { FREE_MESSAGES as m } from "../messages";

/** Style controls of the freeform toolbar: text style/align/bold, theme colours, icon picker. */

export function TextControls({
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

export function ColorPicker({
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

export function IconPicker({ value, onChange }: { value: string; onChange: (icon: (typeof SLIDE_ICON_NAMES)[number]) => void }) {
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
