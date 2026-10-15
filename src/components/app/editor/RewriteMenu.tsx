"use client";

import * as React from "react";
import { WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { plainToRich, type RichText } from "@/lib/slides/rich-text";
import type { RewriteAction } from "@/server/ai/prompts/rewriteText";
import { inputClass } from "./fields/field-ui";
import { REWRITE_MESSAGES as m } from "./messages";
import type { RewriteTarget } from "./rewrite-target";

const QUICK: Exclude<RewriteAction, "custom">[] = ["shorter", "persuasive", "formal", "simpler", "fix"];

interface RewriteMenuProps {
  deckId: string;
  /** The text last clicked into on the slide, if any. */
  target: RewriteTarget | null;
  onEditText: (path: string, value: string) => void;
  onEditRich: (path: string, rich: RichText) => void;
  /** The editor's undo: takes the rewrite back with its formatting. */
  onUndo: () => void;
}

/**
 * "Réécrire" (Task 79): rewrites the text last clicked into on the slide with the AI
 * (shorter, more persuasive…). The result goes in like any edit: autosaved, and Ctrl+Z (or
 * the toast) takes it back.
 */
export function RewriteMenu({ deckId, target, onEditText, onEditRich, onUndo }: RewriteMenuProps) {
  const [busy, setBusy] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [instructions, setInstructions] = React.useState("");

  function write(t: RewriteTarget, text: string) {
    if (t.rich) onEditRich(t.path.replace(/\.text$/, ""), plainToRich(text));
    else onEditText(t.path, text);
  }

  async function run(action: RewriteAction, custom?: string) {
    const t = target;
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId, text: t.text, action, instructions: custom, maxLength: t.maxLength }),
      });
      if (!res.ok) {
        toast.error(res.status === 402 ? m.noCredits : res.status === 429 ? m.rateLimited : m.failed);
        return;
      }
      const data: { text?: unknown } = await res.json();
      if (typeof data.text !== "string" || !data.text) return void toast.error(m.failed);
      write(t, data.text);
      toast.success(m.done, {
        description: t.rich ? m.richNote : undefined,
        action: { label: m.undo, onClick: onUndo },
      });
    } catch {
      toast.error(m.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!target || busy}
            title={target ? undefined : m.hint}
            data-testid="rewrite-menu"
            // Keeps the text's focus, so the target stays the text the user is in.
            onMouseDown={(e) => e.preventDefault()}
          >
            <WandSparkles aria-hidden="true" />
            {busy ? m.busy : m.button}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {QUICK.map((action) => (
            <DropdownMenuItem key={action} data-testid={`rewrite-${action}`} onSelect={() => void run(action)}>
              {m.actions[action]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCustomOpen(true)}>{m.actions.custom}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!instructions.trim()) return;
              setCustomOpen(false);
              void run("custom", instructions.trim());
            }}
          >
            <DialogHeader>
              <DialogTitle>{m.customTitle}</DialogTitle>
              {target && <DialogDescription className="line-clamp-2">« {target.text} »</DialogDescription>}
            </DialogHeader>
            <div className="space-y-1">
              <label htmlFor="rewrite-instructions" className="text-small font-medium text-foreground">
                {m.customLabel}
              </label>
              <input
                id="rewrite-instructions"
                value={instructions}
                maxLength={300}
                placeholder={m.customPlaceholder}
                onChange={(e) => setInstructions(e.target.value)}
                className={inputClass(false)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCustomOpen(false)}>
                {m.cancel}
              </Button>
              <Button type="submit" disabled={!instructions.trim()}>
                {m.customConfirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
