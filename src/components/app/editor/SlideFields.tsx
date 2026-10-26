"use client";

import * as React from "react";
import type { z } from "zod";
import { slideContentSchemas } from "@/lib/slides/schema";
import { FIELD_MESSAGES, FREE_MESSAGES, SLIDE_TYPE_LABELS } from "./messages";
import type { FieldErrors } from "./field-schema";
import type { EditorSlide } from "./validation";
import { RegeneratePanel } from "./RegeneratePanel";
import { findPlaceholders } from "./placeholders";
import { PlaceholderNotice } from "./PlaceholderHints";
import { CueFields } from "./CueFields";
import { ShapeFields } from "./fields/Field";
import { TextareaField } from "./fields/TextInput";

interface SlideFieldsProps {
  slide: EditorSlide;
  errors: FieldErrors;
  onChange: (patch: Partial<EditorSlide>) => void;
  onRegenerate?: (instructions: string) => void;
  isRegenerating?: boolean;
  regenerateError?: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-medium uppercase tracking-wide text-faint">{title}</h3>
      {children}
    </section>
  );
}

/** The inspector's form for one slide: AI regeneration, content fields, presenter material. */
export function SlideFields({ slide, errors, onChange, onRegenerate, isRegenerating, regenerateError }: SlideFieldsProps) {
  const shape = (slideContentSchemas[slide.type] as unknown as z.ZodObject<Record<string, z.ZodType>>).shape;

  return (
    <div className="space-y-6" data-testid="slide-fields">
      <Section title={`${FIELD_MESSAGES.content} — ${SLIDE_TYPE_LABELS[slide.type]}`}>
        {onRegenerate && (
          // Keyed by slide so instructions typed for one slide don't carry over to the next.
          <RegeneratePanel
            key={slide.id}
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating ?? false}
            error={regenerateError}
          />
        )}
        <PlaceholderNotice placeholders={findPlaceholders(slide.content)} />
        {slide.type === "free" ? (
          // Freeform elements are placed and edited on the canvas, not as form fields.
          <p className="rounded-md border border-border p-3 text-small text-muted-foreground" data-testid="free-fields-hint">
            {FREE_MESSAGES.fieldsHint}
          </p>
        ) : (
          <ShapeFields shape={shape} value={slide.content} path="" errors={errors} onChange={(next) => onChange({ content: next })} />
        )}
      </Section>

      <Section title={FIELD_MESSAGES.presenter}>
        <TextareaField name="notes" value={slide.notes} max={2000} error={errors.notes} onChange={(notes) => onChange({ notes })} />
        <TextareaField name="script" value={slide.script} max={4000} error={errors.script} onChange={(script) => onChange({ script })} />
        <CueFields
          // Own key: RegeneratePanel above is keyed by slide.id too, and sibling keys must differ.
          key={`cue-${slide.id}`}
          cue={slide.cue}
          errors={errors}
          onChange={(cue) => onChange({ cue })}
        />
      </Section>
    </div>
  );
}
