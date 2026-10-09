"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { defaultTheme, ThemeTokensSchema, type ThemeTokens } from "@/lib/slides/theme";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { validLayout } from "@/lib/slides/layouts";
import { type DeckWithRelations } from "@/lib/db/repositories/decks";
import { updateDeckAction, deleteDeckAction, duplicateDeckAction } from "@/app/(app)/app/decks/actions";
import { DeckActionsMenu } from "./DeckActionsMenu";
import { DeleteDeckDialog } from "./DeleteDeckDialog";
import { formatRelativeTime } from "./format";
import { dashboardMessages as m } from "./messages";

function resolveTheme(deck: DeckWithRelations): ThemeTokens {
  if (!deck.theme) return defaultTheme;
  const parsed = ThemeTokensSchema.safeParse(deck.theme.tokens);
  return parsed.success ? parsed.data : defaultTheme;
}

function resolveFirstSlide(deck: DeckWithRelations): Slide | null {
  if (!deck.firstSlide) return null;
  const parsed = SlideSchema.safeParse({
    ...deck.firstSlide,
    notes: deck.firstSlide.notes ?? undefined,
    script: deck.firstSlide.script ?? undefined,
    layout: validLayout(deck.firstSlide.type, deck.firstSlide.layout),
  });
  return parsed.success ? parsed.data : null;
}

const failed = (result: unknown) =>
  typeof result === "object" && result !== null && "error" in result && Boolean(result.error);

export function DeckCard({ deck }: { deck: DeckWithRelations }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(deck.title);
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(deck.title);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [duplicating, setDuplicating] = React.useState(false);

  // Server refresh wins over the optimistic title.
  React.useEffect(() => setTitle(deck.title), [deck.title]);

  const theme = React.useMemo(() => resolveTheme(deck), [deck]);
  const firstSlide = React.useMemo(() => resolveFirstSlide(deck), [deck]);
  const refresh = () => React.startTransition(() => router.refresh());

  function cancelRename() {
    setRenameValue(title);
    setRenaming(false);
  }

  async function handleRename(event: React.FormEvent) {
    event.preventDefault();
    const next = renameValue.trim();
    setRenaming(false);
    if (!next || next === title) return;

    const previous = title;
    setTitle(next);
    const result = await updateDeckAction({ id: deck.id, title: next });
    if (failed(result)) {
      setTitle(previous);
      setRenameValue(previous);
      toast.error(m.toast.renameFailed);
      return;
    }
    toast.success(m.toast.renamed);
    refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteDeckAction(deck.id);
    setDeleting(false);
    if (failed(result)) {
      toast.error(m.toast.deleteFailed);
      return;
    }
    setConfirmingDelete(false);
    toast.success(m.toast.deleted);
    refresh();
  }

  async function handleDuplicate() {
    setDuplicating(true);
    const result = await duplicateDeckAction(deck.id);
    setDuplicating(false);
    if (failed(result)) {
      toast.error(m.toast.duplicateFailed);
      return;
    }
    toast.success(m.toast.duplicated);
    refresh();
  }

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-border-strong focus-within:border-border-strong"
      data-testid="deck-card"
      data-deck-title={title}
    >
      <div className="relative aspect-video overflow-hidden border-b border-border bg-surface-2">
        <div inert aria-hidden="true" className="size-full">
          {firstSlide ? (
            <SlideThumbnail slide={firstSlide} theme={theme} className="size-full" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <LayoutTemplate className="size-8 text-faint" />
            </div>
          )}
        </div>
        {/* Overlay, not a wrapper: slides can render their own buttons/links. */}
        <Link
          href={`/app/decks/${deck.id}`}
          aria-label={m.card.edit(title)}
          className="absolute inset-0 outline-none transition-colors duration-150 hover:bg-foreground/3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      </div>

      <div className="flex min-h-16 items-start gap-2 p-3 pr-2">
        {renaming ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-1.5">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && cancelRename()}
              maxLength={120}
              autoFocus
              aria-label={m.card.renameLabel}
              className="h-8"
            />
            <Button type="submit" size="sm">
              {m.card.renameSubmit}
            </Button>
          </form>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-h3 text-foreground">{title}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-small text-faint">
                <span>{m.card.slides(deck.slideCount)}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={deck.updatedAt.toISOString()} suppressHydrationWarning>
                  {formatRelativeTime(deck.updatedAt)}
                </time>
              </p>
            </div>
            {deck.status !== "draft" && (
              <Badge variant={deck.status === "ready" ? "success" : "neutral"} className="mt-0.5">
                {m.card.status[deck.status]}
              </Badge>
            )}
            <DeckActionsMenu
              deckId={deck.id}
              duplicating={duplicating}
              onRename={() => {
                setRenameValue(title);
                setRenaming(true);
              }}
              onDuplicate={handleDuplicate}
              onDelete={() => setConfirmingDelete(true)}
            />
          </>
        )}
      </div>

      <DeleteDeckDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        deckTitle={title}
        pending={deleting}
        onConfirm={handleDelete}
      />
    </article>
  );
}
