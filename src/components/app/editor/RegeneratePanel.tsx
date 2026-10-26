"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REGENERATE_CHIPS, REGENERATE_INSTRUCTIONS_MAX, REGENERATE_MESSAGES as m } from "./messages";

interface RegeneratePanelProps {
  onRegenerate: (instructions: string) => void;
  isRegenerating: boolean;
  error?: string;
}

export function RegeneratePanel({ onRegenerate, isRegenerating, error }: RegeneratePanelProps) {
  const [instructions, setInstructions] = React.useState("");
  const id = React.useId();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
      <Label htmlFor={id} className="flex items-baseline gap-1">
        {m.label}
        <span className="text-xs font-normal text-faint">— {m.optional}</span>
      </Label>
      <Textarea
        id={id}
        rows={2}
        value={instructions}
        maxLength={REGENERATE_INSTRUCTIONS_MAX}
        placeholder={m.placeholder}
        disabled={isRegenerating}
        onChange={(e) => setInstructions(e.target.value)}
      />
      {/* Quick instructions (Task 79): a click fills the field, which stays editable. */}
      <div className="flex flex-wrap gap-1">
        {REGENERATE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={isRegenerating}
            onClick={() => setInstructions(chip)}
            className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs tabular-nums text-faint">
          {instructions.length}/{REGENERATE_INSTRUCTIONS_MAX}
        </span>
        <Button size="sm" disabled={isRegenerating} onClick={() => onRegenerate(instructions.trim())}>
          <Sparkles aria-hidden="true" />
          {isRegenerating ? m.busy : m.button}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
