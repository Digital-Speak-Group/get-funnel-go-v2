"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAX_REVEAL_STEP, REVEAL_EFFECTS, type FreeElement, type RevealEffect } from "@/lib/slides/free";
import { cn } from "@/lib/utils";
import { FREE_MESSAGES } from "../messages";
import { updateElements } from "./free-ops";
import type { FreeCommit } from "./useFreeActions";

const m = FREE_MESSAGES.reveal;
const keepFocus = (event: Event) => event.preventDefault();

/** Highest build step used on the slide (0 when none). */
const maxStep = (elements: FreeElement[]) => Math.max(0, ...elements.map((e) => e.reveal?.step ?? 0));

/**
 * Build-up of the selection while presenting (Task 75): effect and step. A first effect puts
 * the selection on a new step after the existing ones; steps can then be reordered.
 */
export function RevealControl({
  elements,
  selected,
  onChange,
}: {
  elements: FreeElement[];
  selected: FreeElement[];
  onChange: FreeCommit;
}) {
  const ids = selected.map((e) => e.id);
  const first = selected[0]?.reveal;
  const effect: RevealEffect | "none" = first?.effect ?? "none";
  const last = maxStep(elements);
  const stepOptions = Array.from({ length: Math.min(MAX_REVEAL_STEP, last + 1) }, (_, i) => i + 1);

  function setEffect(next: RevealEffect | "none") {
    onChange(
      updateElements(elements, ids, (e) => {
        const copy = { ...e };
        if (next === "none") delete copy.reveal;
        else copy.reveal = { step: e.reveal?.step ?? Math.min(MAX_REVEAL_STEP, last + 1), effect: next };
        return copy;
      })
    );
  }

  function setStep(step: number) {
    onChange(updateElements(elements, ids, (e) => (e.reveal ? { ...e, reveal: { ...e.reveal, step } } : e)));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(first && "bg-surface-3 text-foreground")}
          data-testid="free-reveal"
          aria-label={first ? `${m.button} : ${m.stepValue(first.step)}` : m.button}
          title={m.title}
        >
          <Sparkles aria-hidden="true" />
          {first && <span className="font-mono text-xs tabular-nums">{first.step}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3 p-3" onCloseAutoFocus={keepFocus}>
        <div>
          <p className="text-small font-medium text-foreground">{m.title}</p>
          <p className="mt-0.5 text-xs text-faint">{m.hint}</p>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-label={m.effect}>
          {(["none", ...REVEAL_EFFECTS] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={effect === value}
              data-testid={`free-reveal-${value}`}
              onClick={() => setEffect(value)}
              className={cn(
                "rounded px-1 py-1 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                effect === value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.effects[value]}
            </button>
          ))}
        </div>
        {first && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-small text-foreground" id="free-reveal-step">
              {m.step}
            </span>
            <Select value={String(first.step)} onValueChange={(v) => setStep(Number(v))}>
              <SelectTrigger className="h-8 w-28" aria-labelledby="free-reveal-step" data-testid="free-reveal-step">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stepOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {m.stepValue(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
