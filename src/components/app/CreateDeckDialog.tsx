"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDeckAction } from "@/app/(app)/app/decks/actions";

interface CreateDeckDialogProps {
  themes: { id: string; name: string }[];
}

export function CreateDeckDialog({ themes }: CreateDeckDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template");

  const [open, setOpen] = React.useState(!!templateIdParam);
  const [title, setTitle] = React.useState("");
  const [themeId, setThemeId] = React.useState(themes[0]?.id ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Sync open state with template param on mount/change
  React.useEffect(() => {
    if (templateIdParam) {
      setOpen(true);
    }
  }, [templateIdParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 1 || trimmed.length > 120) {
      setError("Le titre doit contenir entre 1 et 120 caractères.");
      return;
    }
    if (!themeId) {
      setError("Sélectionnez un thème.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await createDeckAction({ 
      title: trimmed, 
      themeId,
      ...(templateIdParam ? { templateId: templateIdParam } : {})
    });

    if ("error" in result && result.error) {
      setError("La création a échoué. Réessayez.");
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setOpen(false);
    setIsSubmitting(false);
    
    React.startTransition(() => {
      router.push("/app"); // Clear the template param from URL
      router.refresh();
    });
  }

  function handleClose() {
    setOpen(false);
    if (templateIdParam) {
      router.push("/app");
    }
  }

  if (themes.length === 0) return null;

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)} data-testid="create-deck-open">
        <Plus className="w-5 h-5" />
        Nouveau deck
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-deck-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl"
          >
            <div>
              <h2 id="create-deck-title" className="text-xl font-semibold text-white">
                Nouveau deck
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Donnez un titre à votre deck, vous pourrez le modifier ensuite.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="deck-title" className="block text-sm font-medium text-zinc-300">
                Titre
              </label>
              <input
                id="deck-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Présentation commerciale — Janvier"
                maxLength={120}
                autoFocus
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="deck-theme" className="block text-sm font-medium text-zinc-300">
                Thème
              </label>
              <select
                id="deck-theme"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer le deck"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
