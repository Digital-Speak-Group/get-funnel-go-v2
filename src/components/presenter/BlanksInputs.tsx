"use client";

import * as React from "react";
import { Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BLANK_VALUE_MAX } from "@/lib/realtime/blanks";
import type { z } from "zod";
import type { Slide, slideContentSchemas } from "@/lib/slides/schema";
import { PRESENTER_MESSAGES } from "./messages";

const m = PRESENTER_MESSAGES.blanks;

interface BlanksInputsProps {
  /** A slide of type `blanks`. */
  slide: Slide;
  values: string[];
  onChange: (values: string[]) => void;
}

/** Inputs for a `blanks` slide: what the presenter types shows on the slide and the audience screen. */
export function BlanksInputs({ slide, values, onChange }: BlanksInputsProps) {
  const { fields } = slide.content as z.infer<(typeof slideContentSchemas)["blanks"]>;
  return (
    <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/10 p-3" data-testid="presenter-blanks">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand">
        <Radio className="h-3.5 w-3.5" aria-hidden="true" />
        {m.title}
      </p>
      {fields.map((field, i) => {
        const id = `blank-${slide.id}-${i}`;
        return (
          <div key={i} className="space-y-1">
            <Label htmlFor={id}>{field.label}</Label>
            <div className="flex items-center gap-2">
              {field.prefix && <span className="text-sm text-muted-foreground">{field.prefix}</span>}
              <Input
                id={id}
                value={values[i] ?? ""}
                maxLength={BLANK_VALUE_MAX}
                placeholder={field.hint}
                data-testid={`presenter-blank-${i}`}
                onChange={(e) => {
                  const next = fields.map((_, j) => values[j] ?? "");
                  next[i] = e.target.value;
                  onChange(next);
                }}
              />
              {field.suffix && <span className="text-sm text-muted-foreground">{field.suffix}</span>}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-faint">{m.hint}</p>
    </section>
  );
}
