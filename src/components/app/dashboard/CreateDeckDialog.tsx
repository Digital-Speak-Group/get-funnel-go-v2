"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDeckAction } from "@/app/(app)/app/decks/actions";
import { dashboardMessages } from "./messages";

const m = dashboardMessages.create;

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

  // "Use template" links land on /app?template=<id>
  React.useEffect(() => {
    if (templateIdParam) setOpen(true);
  }, [templateIdParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 1 || trimmed.length > 120) {
      setError(m.errorTitle);
      return;
    }
    if (!themeId) {
      setError(m.errorTheme);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await createDeckAction({
      title: trimmed,
      themeId,
      ...(templateIdParam ? { templateId: templateIdParam } : {}),
    });

    if ("error" in result && result.error) {
      setError(m.errorFailed);
      setIsSubmitting(false);
      return;
    }

    setTitle("");
    setOpen(false);
    setIsSubmitting(false);
    toast.success(dashboardMessages.toast.created);

    React.startTransition(() => {
      router.push("/app"); // Clear the template param from URL
      router.refresh();
    });
  }

  function handleOpenChange(next: boolean) {
    if (isSubmitting) return;
    setOpen(next);
    if (!next) {
      setError(null);
      if (templateIdParam) router.push("/app");
    }
  }

  if (themes.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" data-testid="create-deck-open">
          <Plus />
          {dashboardMessages.blankDeck}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{m.title}</DialogTitle>
            <DialogDescription>{templateIdParam ? m.fromTemplate : m.description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="deck-title">{m.titleLabel}</Label>
            <Input
              id="deck-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={m.titlePlaceholder}
              maxLength={120}
              autoFocus
              aria-invalid={error === m.errorTitle || undefined}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deck-theme">{m.themeLabel}</Label>
            <Select value={themeId} onValueChange={setThemeId}>
              <SelectTrigger id="deck-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-small text-danger" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              {m.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? m.pending : m.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
