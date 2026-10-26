"use client";

import * as React from "react";

import { Check, LayoutTemplate } from "lucide-react";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { ThemeChoiceGrid, type ThemeChoice } from "@/components/app/dashboard/ThemeChoiceGrid";
import type { Slide } from "@/lib/slides/schema";
import { cn } from "@/lib/utils";
import { WIZARD_MESSAGES as m } from "../messages";

export interface WizardTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  stages: string[];
  cover?: Slide;
}

interface DesignStepProps {
  templates: WizardTemplate[];
  templateId: string;
  onTemplate: (id: string) => void;
  themes: ThemeChoice[];
  themeId: string;
  onTheme: (id: string) => void;
}

/** Template and theme as cards; template covers are shown in the chosen theme. */
export function DesignStep({ templates, templateId, onTemplate, themes, themeId, onTheme }: DesignStepProps) {
  const theme = themes.find((t) => t.id === themeId)?.tokens ?? themes[0]?.tokens;
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id="wizard-template-label" className="text-h3 text-foreground">{m.design.template}</h2>
          <span className="text-small text-faint">{m.design.templateHint}</span>
        </div>
        <div role="radiogroup" aria-labelledby="wizard-template-label" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const selected = template.id === templateId;
            return (
              <label
                key={template.id}
                data-testid="wizard-template"
                className={cn(
                  "group cursor-pointer overflow-hidden rounded-lg border bg-surface transition-colors duration-150",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
                  selected ? "border-primary" : "border-border hover:border-border-strong"
                )}
              >
                <input type="radio" name="wizard-template" value={template.id} checked={selected} onChange={() => onTemplate(template.id)} className="sr-only" />
                <div inert aria-hidden="true" className="aspect-video border-b border-border bg-surface-2">
                  {template.cover && theme ? (
                    <SlideThumbnail slide={template.cover} theme={theme} className="size-full" />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <LayoutTemplate className="size-8 text-faint" />
                    </span>
                  )}
                </div>
                <span className="block space-y-1 p-3">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{template.name}</span>
                    {selected && <Check className="size-4 shrink-0 text-brand" aria-hidden="true" />}
                  </span>
                  <span className="block font-mono text-xs tabular-nums text-faint">{m.design.stages(template.stages.length)}</span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h2 id="wizard-theme-label" className="text-h3 text-foreground">{m.design.theme}</h2>
          <span className="text-small text-faint">{m.design.themeHint}</span>
        </div>
        <ThemeChoiceGrid themes={themes} value={themeId} onChange={onTheme} deckTitle="" labelledBy="wizard-theme-label" />
      </section>
    </div>
  );
}
