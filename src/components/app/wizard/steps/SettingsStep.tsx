import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WIZARD_MESSAGES as m } from "../messages";

export interface WizardBudget {
  decksUsed: number;
  decksLimit: number;
  /** The server would refuse a new generation (same rule as `reserveCredits`). */
  exhausted: boolean;
}

interface SettingsStepProps {
  slideCount: number;
  onSlideCount: (n: number) => void;
  tone: string;
  onTone: (tone: string) => void;
  summary: { template: string; theme: string };
  budget: WizardBudget;
  onUpgrade: () => void;
}

export function SettingsStep({ slideCount, onSlideCount, tone, onTone, summary, budget, onUpgrade }: SettingsStepProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="wizard-slide-count">{m.settings.slideCount}</Label>
            <span className="font-mono text-sm tabular-nums text-foreground">{m.settings.slideCountValue(slideCount)}</span>
          </div>
          <input
            id="wizard-slide-count"
            type="range"
            min={5}
            max={40}
            value={slideCount}
            onChange={(e) => onSlideCount(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between font-mono text-xs tabular-nums text-faint" aria-hidden="true">
            <span>5</span>
            <span>40</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wizard-tone">{m.settings.tone}</Label>
          <Select value={tone} onValueChange={onTone}>
            <SelectTrigger id="wizard-tone" className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(m.settings.tones).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <aside className="space-y-4 rounded-lg border border-border bg-surface p-4" aria-label={m.settings.summary}>
        <h2 className="text-h3 text-foreground">{m.settings.summary}</h2>
        <dl className="space-y-2 text-small">
          {[
            [m.design.template, summary.template],
            [m.design.theme, summary.theme],
            [m.settings.slideCount, m.settings.slideCountValue(slideCount)],
            [m.settings.tone, m.settings.tones[tone] ?? tone],
          ].map(([term, value]) => (
            <div key={term} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="truncate text-right text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-1 border-t border-border pt-3 text-small" data-testid="wizard-cost">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{m.settings.cost}</span>
            <span className="flex items-center gap-1.5 text-foreground">
              <Sparkles className="size-3.5 text-brand" aria-hidden="true" />
              {m.settings.costValue}
            </span>
          </div>
          <p className="font-mono text-xs tabular-nums text-faint">{m.settings.remaining(budget.decksUsed, budget.decksLimit)}</p>
        </div>
        {budget.exhausted && (
          <div className="space-y-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-small text-foreground" role="status">
            <p>{m.settings.limitReached}</p>
            <Button type="button" size="sm" onClick={onUpgrade}>
              {m.settings.upgrade}
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
