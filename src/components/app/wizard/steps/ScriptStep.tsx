import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WIZARD_MESSAGES as m } from "../messages";

export const SCRIPT_MIN = 300;
export const SCRIPT_MAX = 30000;

export function ScriptStep({ script, onChange }: { script: string; onChange: (script: string) => void }) {
  const length = script.length;
  const tooShort = length > 0 && length < SCRIPT_MIN;
  const tooLong = length > SCRIPT_MAX;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor="wizard-script">{m.script.label}</Label>
        <span
          className={cn("font-mono text-xs tabular-nums", tooLong ? "text-danger" : "text-faint")}
          data-testid="wizard-script-count"
          aria-live="polite"
        >
          {m.script.count(length, SCRIPT_MAX)}
        </span>
      </div>
      <Textarea
        id="wizard-script"
        value={script}
        onChange={(e) => onChange(e.target.value)}
        placeholder={m.script.placeholder}
        aria-invalid={tooLong || undefined}
        aria-describedby="wizard-script-hint"
        className="min-h-[22rem] resize-y text-sm leading-relaxed"
        autoFocus
      />
      <p id="wizard-script-hint" className={cn("text-small", tooShort || tooLong ? "text-danger" : "text-faint")}>
        {tooLong ? m.script.tooLong : tooShort ? m.script.tooShort(SCRIPT_MIN - length) : m.script.hint}
      </p>
    </div>
  );
}
