"use client";

import * as React from "react";

import { Check, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STAGES, stageStatus, type GenerationState } from "./generation-state";
import { WIZARD_MESSAGES as m } from "./messages";

interface GenerationProgressProps {
  state: GenerationState;
  onCancel: () => void;
  onRetry: () => void;
  onUpgrade: () => void;
}

/** Vertical stage timeline (Réservation → Brief → Plan → Slides n/N → Enregistrement → Terminé). */
export function GenerationProgress({ state, onCancel, onRetry, onUpgrade }: GenerationProgressProps) {

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-lg border border-border bg-surface p-6" data-testid="wizard-progress">
      <div className="space-y-1">
        <h2 className="text-h2 text-foreground">{m.progress.title}</h2>
        <p className="text-small text-muted-foreground">{m.progress.hint}</p>
      </div>

      <ol className="space-y-0" aria-live="polite">
        {STAGES.map((stage, index) => {
          const status = stageStatus(state, stage);
          const failedHere = state.phase === "error" && status === "current";
          const ratio = state.slidesTotal > 0 ? state.slidesDone / state.slidesTotal : 0;
          return (
            <li key={stage} className="relative flex gap-3 pb-5 last:pb-0" data-stage={stage} data-status={status}>
              {index < STAGES.length - 1 && (
                <span className={cn("absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-px", status === "done" ? "bg-primary/50" : "bg-border")} aria-hidden="true" />
              )}
              <span
                className={cn(
                  "relative flex size-6 shrink-0 items-center justify-center rounded-full border",
                  status === "done" && "border-primary/40 bg-primary/15 text-brand",
                  status === "current" && !failedHere && "border-primary text-brand",
                  failedHere && "border-danger text-danger",
                  status === "pending" && "border-border-strong text-faint"
                )}
                aria-hidden="true"
              >
                {status === "done" ? (
                  <Check className="size-3.5" />
                ) : status === "current" && state.phase === "running" ? (
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Circle className="size-2 fill-current" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn("text-sm", status === "pending" ? "text-faint" : "text-foreground")}>{m.progress.stages[stage]}</span>
                  {stage === "slides" && state.slidesTotal > 0 && (
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {m.progress.slidesCount(state.slidesDone, state.slidesTotal)}
                    </span>
                  )}
                </div>
                {stage === "slides" && status === "current" && state.slidesTotal > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={state.slidesTotal} aria-valuenow={state.slidesDone}>
                    <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${ratio * 100}%` }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {state.phase === "running" && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {m.progress.cancel}
          </Button>
        </div>
      )}
      {state.phase === "error" && (
        <div className="space-y-3 rounded-md border border-danger/30 bg-danger/10 p-3 text-small text-foreground" role="alert">
          <p>{state.limitHit ? m.settings.limitReached : state.interrupted ? m.progress.interrupted : m.progress.failed}</p>
          {!state.limitHit && state.error && <p className="font-mono text-xs text-muted-foreground">{state.error}</p>}
          <div className="flex gap-2">
            {state.limitHit && (
              <Button type="button" size="sm" onClick={onUpgrade}>
                {m.settings.upgrade}
              </Button>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              {m.progress.retry}
            </Button>
          </div>
        </div>
      )}
      {state.phase === "cancelled" && (
        <div className="space-y-3 text-small text-muted-foreground" role="status">
          <p>{m.progress.cancelled}</p>
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            {m.progress.retry}
          </Button>
        </div>
      )}
    </div>
  );
}
