"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/patterns/PageHeader";
import { UpgradeDialog } from "@/components/app/billing/UpgradeDialog";
import type { ThemeChoice } from "@/components/app/dashboard/ThemeChoiceGrid";
import { Stepper } from "./Stepper";
import { ScriptStep, SCRIPT_MAX, SCRIPT_MIN } from "./steps/ScriptStep";
import { DesignStep, type WizardTemplate } from "./steps/DesignStep";
import { SettingsStep, type WizardBudget } from "./steps/SettingsStep";
import { GenerationProgress } from "./GenerationProgress";
import { useGeneration } from "./useGeneration";
import { WIZARD_MESSAGES as m } from "./messages";

interface GenerationWizardProps {
  themes: ThemeChoice[];
  templates: WizardTemplate[];
  budget: WizardBudget;
  plan: string;
}

/** Script → Modèle & thème → Paramètres, then the generation timeline (Task 45). */
export function GenerationWizard({ themes, templates, budget, plan }: GenerationWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [script, setScript] = React.useState("");
  const [templateId, setTemplateId] = React.useState(templates[0]?.id ?? "");
  const [themeId, setThemeId] = React.useState(themes[0]?.id ?? "");
  const [slideCount, setSlideCount] = React.useState(20);
  const [tone, setTone] = React.useState("professional");
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);
  const generation = useGeneration();

  const template = templates.find((t) => t.id === templateId);
  const theme = themes.find((t) => t.id === themeId);
  const scriptOk = script.length >= SCRIPT_MIN && script.length <= SCRIPT_MAX;
  const canContinue = step === 0 ? scriptOk : step === 1 ? Boolean(template && theme) : true;

  async function generate() {
    if (budget.exhausted) return setUpgradeOpen(true);
    if (!template || !theme || !scriptOk) return;
    const result = await generation.start({
      script,
      themeId: theme.id,
      // id is stored as decks.template_id (uuid FK), not the slug
      templateConfig: { id: template.id, name: template.name, stages: template.stages },
      options: { slideCount, tone },
    });
    if (result.phase === "done" && result.deckId) router.push(`/app/decks/${result.deckId}`);
    else if (result.limitHit) setUpgradeOpen(true);
  }

  async function upgrade(planKey: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey, returnUrl: window.location.href }),
    });
    const data: { url?: string } = await res.json().catch(() => ({}));
    if (data.url) window.location.href = data.url;
  }

  const generating = generation.state.phase !== "idle";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6 lg:p-8">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border border-primary/30 bg-primary/15">
              <Wand2 className="size-4 text-brand" aria-hidden="true" />
            </span>
            {m.title}
          </span>
        }
        description={m.description}
      />

      {generating ? (
        <GenerationProgress
          state={generation.state}
          onCancel={generation.cancel}
          onRetry={generation.reset}
          onUpgrade={() => setUpgradeOpen(true)}
        />
      ) : (
        <div className="space-y-8">
          <Stepper current={step} onSelect={setStep} />

          {step === 0 && <ScriptStep script={script} onChange={setScript} />}
          {step === 1 && (
            <DesignStep
              templates={templates}
              templateId={templateId}
              onTemplate={setTemplateId}
              themes={themes}
              themeId={themeId}
              onTheme={setThemeId}
            />
          )}
          {step === 2 && (
            <SettingsStep
              slideCount={slideCount}
              onSlideCount={setSlideCount}
              tone={tone}
              onTone={setTone}
              summary={{ template: template?.name ?? "", theme: theme?.name ?? "" }}
              budget={budget}
              onUpgrade={() => setUpgradeOpen(true)}
            />
          )}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ArrowLeft aria-hidden="true" />
              {m.back}
            </Button>
            {step < m.steps.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canContinue} data-testid="wizard-next">
                {m.next}
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" onClick={() => void generate()} data-testid="wizard-generate">
                {m.generate}
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      )}

      <UpgradeDialog open={upgradeOpen} currentPlan={plan} onClose={() => setUpgradeOpen(false)} onUpgrade={(p) => void upgrade(p)} />
    </div>
  );
}
