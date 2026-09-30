"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MoreVertical, Edit, Trash2, Play, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { defaultTheme, ThemeTokensSchema, type ThemeTokens } from "@/lib/slides/theme";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { type DeckWithRelations } from "@/lib/db/repositories/decks";
import {
  updateDeckAction,
  deleteDeckAction,
  duplicateDeckAction,
} from "@/app/(app)/app/decks/actions";

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
  });
  return parsed.success ? parsed.data : null;
}

export function DeckCard({ deck }: { deck: DeckWithRelations }) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(deck.title);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);

  const [optimisticTitle, setOptimisticTitle] = React.useState(deck.title);

  // Sync state if server updates
  React.useEffect(() => {
    setOptimisticTitle(deck.title);
  }, [deck.title]);

  const theme = React.useMemo(() => resolveTheme(deck), [deck]);
  const firstSlide = React.useMemo(() => resolveFirstSlide(deck), [deck]);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const newTitle = renameValue.trim();
    if (!newTitle || newTitle === deck.title) {
      setIsRenaming(false);
      return;
    }
    
    // Optimistic update
    setOptimisticTitle(newTitle);
    
    const result = await updateDeckAction({ id: deck.id, title: newTitle });
    if ("error" in result && result.error) {
      setRenameValue(deck.title);
      setOptimisticTitle(deck.title);
    }
    setIsRenaming(false);
    React.startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!confirm(`Supprimer "${deck.title}" ? Cette action est irréversible.`)) return;
    setIsDeleting(true);
    await deleteDeckAction(deck.id);
    React.startTransition(() => {
      setIsDeleting(false);
      router.refresh();
    });
  }

  async function handleDuplicate() {
    setIsDuplicating(true);
    await duplicateDeckAction(deck.id);
    React.startTransition(() => {
      setIsDuplicating(false);
      router.refresh();
    });
  }

  return (
    <article
      className={cn(
        "group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300",
        "hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10"
      )}
      data-testid="deck-card"
      data-deck-title={optimisticTitle}
    >
      <div className="relative aspect-video overflow-hidden">
        {firstSlide ? (
          <SlideThumbnail slide={firstSlide} theme={theme} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <svg
              className="w-16 h-16 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute bottom-3 left-3 right-3 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
          <Link
            href={`/present/${deck.id}`}
            className={cn(
              "ml-3 px-3 py-2 rounded-full bg-violet-600 text-white text-sm font-medium",
              "hover:bg-violet-500 transition-colors shadow-lg"
            )}
            aria-label="Présenter"
          >
            <Play className="w-4 h-4" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "mr-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white",
                  "hover:bg-black/70 transition-colors"
                )}
                aria-label="Plus d'options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setIsRenaming(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Renommer
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {isDuplicating ? "Duplication..." : "Dupliquer"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 text-red-400 focus:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Suppression..." : "Supprimer"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isRenaming ? (
          <form onSubmit={handleRename} className="flex gap-2">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setRenameValue(deck.title);
                  setIsRenaming(false);
                }
              }}
              className={cn(
                "flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg",
                "text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              )}
              autoFocus
              aria-label="Nouveau titre du deck"
            />
            <Button type="submit" size="sm" className="h-9">
              OK
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setRenameValue(deck.title);
                setIsRenaming(false);
              }}
              className="h-9"
            >
              Annuler
            </Button>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-white truncate">{optimisticTitle}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                <span>{deck.slideCount} slides</span>
                <span>•</span>
                <span>{deck.status}</span>
                <span>•</span>
                <span>{deck.updatedAt.toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
            <Link
              href={`/app/decks/${deck.id}`}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              aria-label="Éditer"
            >
              <Edit className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
