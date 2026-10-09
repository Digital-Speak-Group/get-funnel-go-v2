"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REGENERATE_INSTRUCTIONS_MAX, REGENERATE_MESSAGES as m } from "./messages";

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
