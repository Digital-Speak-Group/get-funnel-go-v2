"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDeckAction } from "@/app/(app)/app/decks/actions";
import { TOPBAR_MESSAGES as m } from "./messages";

/** The deck title as the page heading; the pencil turns it into an input (Enter saves, Escape cancels). */
export function DeckTitle({ deckId, initialTitle }: { deckId: string; initialTitle: string }) {
  const [title, setTitle] = React.useState(initialTitle);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(initialTitle);

  async function save() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === title || next.length > 120) return;
    const previous = title;
    setTitle(next);
    const res = await updateDeckAction({ id: deckId, title: next });
    if ("error" in res) {
      setTitle(previous);
      toast.error(m.renameFailed);
    }
  }

  if (editing) {
    return (
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void save()}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") setEditing(false);
        }}
        maxLength={120}
        autoFocus
        aria-label={m.titleLabel}
        className="h-9 max-w-md text-h3"
        data-testid="editor-title-input"
      />
    );
  }

  return (
    <div className="group flex min-w-0 items-center gap-1">
      <h1 className="truncate text-h2 text-foreground" data-testid="editor-title">
        {title}
      </h1>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={m.rename}
        title={m.rename}
        className="shrink-0 opacity-60 group-hover:opacity-100"
        onClick={() => {
          setDraft(title);
          setEditing(true);
        }}
      >
        <Pencil aria-hidden="true" />
      </Button>
    </div>
  );
}
