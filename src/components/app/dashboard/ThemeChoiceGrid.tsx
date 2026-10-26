"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";
import { dashboardMessages } from "./messages";

const m = dashboardMessages.create;

export interface ThemeChoice {
  id: string;
  name: string;
  tokens: ThemeTokens;
}

interface ThemeChoiceGridProps {
  themes: ThemeChoice[];
  value: string;
  onChange: (themeId: string) => void;
  /** Shown on every preview so the user sees their own deck, not a sample. */
  deckTitle: string;
  labelledBy: string;
}

/**
 * Theme picker for a new deck: a live cover slide per theme. Native radios (visually
 * hidden) give the arrow-key navigation and screen-reader semantics of a radio group.
 */
export function ThemeChoiceGrid({ themes, value, onChange, deckTitle, labelledBy }: ThemeChoiceGridProps) {
  const previewSlide = React.useMemo<Slide>(
    () => ({
      id: "00000000-0000-4000-8000-0000000000f1",
      position: 0,
      type: "cover",
      content: { title: deckTitle.trim() || m.previewTitle, subtitle: m.previewSubtitle },
    }),
    [deckTitle]
  );

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {themes.map((theme) => {
        const selected = theme.id === value;
        return (
          <label
            key={theme.id}
            className={cn(
              "group relative cursor-pointer rounded-lg border p-1.5 transition-colors duration-150",
              "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-surface",
              selected ? "border-primary bg-primary/10" : "border-border hover:border-border-strong"
            )}
            data-testid="theme-choice"
          >
            <input
              type="radio"
              name="deck-theme"
              value={theme.id}
              checked={selected}
              onChange={() => onChange(theme.id)}
              className="sr-only"
            />
            <div inert aria-hidden="true" className="aspect-video overflow-hidden rounded-md">
              <SlideThumbnail slide={previewSlide} theme={theme.tokens} className="size-full" />
            </div>
            <span className="flex items-center justify-between gap-2 px-1 pb-0.5 pt-2">
              <span className={cn("truncate text-small", selected ? "text-foreground" : "text-muted-foreground")}>
                {theme.name}
              </span>
              {selected && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
            </span>
          </label>
        );
      })}
    </div>
  );
}
