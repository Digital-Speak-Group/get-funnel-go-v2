"use client";

import * as React from "react";

import Link from "next/link";
import { ChevronLeft, Play } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/app/patterns/StatusPill";
import { CopyAudienceLinkButton } from "@/components/presenter/CopyAudienceLinkButton";
import { DeckTitle } from "./DeckTitle";
import { ExportMenu } from "./ExportMenu";
import { ThemeDialog } from "./ThemeDialog";
import { STATUS_LABELS, TOPBAR_MESSAGES as m } from "./messages";
import type { SaveStatus } from "./useEditorState";

const PILL_STATUS = {
  idle: "idle",
  pending: "saving",
  saving: "saving",
  saved: "saved",
  invalid: "error",
  error: "error",
} as const;

interface EditorTopBarProps {
  deck: { id: string; title: string; presentToken: string };
  slideCount: number;
  status: SaveStatus;
  themeSlug: string;
  themeName: string;
  onTheme: (slug: string) => void;
}

/** Back, deck title (renamable), save state, then theme · audience link · export · Présenter. */
export function EditorTopBar({ deck, slideCount, status, themeSlug, themeName, onTheme }: EditorTopBarProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button asChild variant="ghost" size="icon-sm">
        <Link href="/app" aria-label={m.back}>
          <ChevronLeft aria-hidden="true" />
        </Link>
      </Button>
      {/* Title row takes the full width on small screens; the actions wrap below it. */}
      <div className="flex min-w-0 basis-[calc(100%-3rem)] items-center gap-3 sm:flex-1 sm:basis-auto">
        <DeckTitle deckId={deck.id} initialTitle={deck.title} />
        <span className="hidden shrink-0 font-mono text-xs tabular-nums text-faint sm:inline">{m.slides(slideCount)}</span>
        <StatusPill status={PILL_STATUS[status]} data-testid="editor-status" className="shrink-0">
          {STATUS_LABELS[status]}
        </StatusPill>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ThemeDialog selectedThemeId={themeSlug} themeName={themeName} onSelect={onTheme} />
        <CopyAudienceLinkButton presentToken={deck.presentToken} className={buttonVariants({ variant: "secondary", size: "sm" })} />
        <ExportMenu deckId={deck.id} deckTitle={deck.title} />
        <Button asChild size="sm">
          <Link href={`/present/${deck.id}`}>
            <Play aria-hidden="true" />
            {m.present}
          </Link>
        </Button>
      </div>
    </header>
  );
}
