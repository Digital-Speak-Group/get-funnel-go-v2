"use client";

import * as React from "react";
import { Ban } from "lucide-react";
import { Illustration } from "@/components/slides/illustrations/Illustration";
import { ILLUSTRATIONS, type IllustrationName } from "@/lib/slides/illustrations";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { ILLUSTRATION_MESSAGES as m } from "./messages";

interface IllustrationPickerProps {
  value?: string;
  theme: ThemeTokens;
  onChange: (name: IllustrationName | undefined) => void;
}

/** Optional decorative illustration for the slide, previewed in the deck's colours. */
export function IllustrationPicker({ value, theme, onChange }: IllustrationPickerProps) {
  const colors = { primary: theme.color.primary, accent: theme.color.accent, muted: theme.color.muted };
  const tile = (selected: boolean) =>
    cn(
      "flex flex-col items-center gap-1 rounded-md p-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
      selected ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted"
    );

  return (
    <details className="mb-4 rounded-lg border border-border px-3 py-2" open={value !== undefined} data-testid="illustration-picker">
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        {m.section}
        {value && <span className="font-normal text-muted-foreground"> · {m.names[value] ?? value}</span>}
      </summary>
      <p className="mt-2 text-xs text-faint">{m.hint}</p>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        <button type="button" aria-pressed={!value} onClick={() => onChange(undefined)} className={tile(!value)} data-testid="illustration-option-none">
          <span className="flex aspect-[4/3] w-full items-center justify-center rounded border border-border">
            <Ban className="h-4 w-4" aria-hidden="true" />
          </span>
          {m.none}
        </button>
        {ILLUSTRATIONS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={tile(value === name)}
            data-testid={`illustration-option-${name}`}
          >
            <span className="block aspect-[4/3] w-full rounded border border-border p-1" style={{ background: theme.color.bg }}>
              <Illustration name={name} colors={colors} style={{ width: "100%", height: "100%" }} />
            </span>
            <span className="w-full truncate text-center">{m.names[name]}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
