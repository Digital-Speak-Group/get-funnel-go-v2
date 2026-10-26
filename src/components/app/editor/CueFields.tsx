"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CUE_MESSAGES as m } from "./messages";
import type { FieldErrors } from "./field-schema";
import type { EditorCue } from "./cue";

type CueKey = keyof EditorCue;

/** Display order; `max` mirrors ScriptCueSchema, `rows` makes a textarea. */
const FIELDS: Array<{ key: CueKey; max?: number; rows?: number; numeric?: boolean }> = [
  { key: "punchline", max: 240, rows: 2 },
  { key: "tag", max: 30 },
  { key: "durationSec", numeric: true },
  { key: "transition", max: 300, rows: 2 },
  { key: "bullets", rows: 3 },
  { key: "closing", max: 120 },
];

interface CueFieldsProps {
  cue: EditorCue;
  errors: FieldErrors;
  onChange: (next: EditorCue) => void;
}

/** Structured script cue, collapsed unless the slide already has one. */
export function CueFields({ cue, errors, onChange }: CueFieldsProps) {
  const [open, setOpen] = React.useState(() => Object.values(cue).some((v) => v.trim() !== ""));

  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className="rounded-lg border border-border bg-surface px-3 py-2"
      data-testid="slide-cue"
    >
      <summary className="cursor-pointer text-sm font-medium text-foreground">{m.section}</summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs text-faint">{m.hint}</p>
        {FIELDS.map(({ key, max, rows, numeric }) => {
          const id = `slide-cue-${key}`;
          // Bullet errors arrive per line (`cue.bullets.2`); show the first under the textarea.
          const error = Object.entries(errors).find(
            ([path]) => path === `cue.${key}` || path.startsWith(`cue.${key}.`)
          )?.[1]?.[0];
          const shared = {
            id,
            value: cue[key],
            "data-testid": id,
            "aria-invalid": error ? true : undefined,
          };
          return (
            <div key={key} className="space-y-1">
              <Label htmlFor={id}>{m[key]}</Label>
              {rows ? (
                <Textarea {...shared} rows={rows} onChange={(e) => onChange({ ...cue, [key]: e.target.value })} />
              ) : (
                <Input
                  {...shared}
                  type={numeric ? "number" : "text"}
                  min={numeric ? 5 : undefined}
                  max={numeric ? 1800 : undefined}
                  step={numeric ? 5 : undefined}
                  onChange={(e) => onChange({ ...cue, [key]: e.target.value })}
                />
              )}
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-danger" data-testid={error ? `slide-error-cue-${key}` : undefined}>
                  {error ?? ""}
                </span>
                {max !== undefined && (
                  <span className={cue[key].length > max ? "text-danger" : "text-faint"}>
                    {cue[key].length}/{max}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
