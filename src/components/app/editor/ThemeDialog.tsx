"use client";

import * as React from "react";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeChoiceGrid } from "@/components/app/dashboard/ThemeChoiceGrid";
import { systemThemes } from "@/lib/slides/theme";
import { THEME_MESSAGES } from "./messages";

/** System themes keyed by slug, the id the editor selects with. */
const THEME_CHOICES = systemThemes.map((tokens) => ({ id: tokens.id, name: tokens.name, tokens }));

interface ThemeDialogProps {
  selectedThemeId: string;
  themeName: string;
  onSelect: (themeId: string) => void;
}

/** Deck theme picker, opened from the editor top bar: a full-width grid instead of a cramped side-panel list. */
export function ThemeDialog({ selectedThemeId, themeName, onSelect }: ThemeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" data-testid="theme-dialog-trigger">
          <Palette className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{THEME_MESSAGES.label}</span>
          <span className="hidden max-w-32 truncate text-muted-foreground lg:inline">· {themeName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle id="theme-dialog-title">{THEME_MESSAGES.title}</DialogTitle>
          <DialogDescription>{THEME_MESSAGES.description}</DialogDescription>
        </DialogHeader>
        <div className="-mx-1 max-h-[min(36rem,65dvh)] overflow-y-auto p-1">
          <ThemeChoiceGrid
            themes={THEME_CHOICES}
            value={selectedThemeId}
            onChange={onSelect}
            deckTitle=""
            labelledBy="theme-dialog-title"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
