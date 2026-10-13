"use client";

import * as React from "react";
import { takeSseData } from "./sse";
import { applyGenerationEvent, initialGeneration, type GenerationEvent, type GenerationState } from "./generation-state";
import { WIZARD_MESSAGES as m } from "./messages";

export interface GenerationRequest {
  script: string;
  themeId: string;
  templateConfig: { id: string; name: string; stages: string[] };
  options: { slideCount: number; tone: string };
}

/**
 * Starts a generation on `/api/ai/generate` and follows its event stream. `cancel` stops
 * following it; the server finishes on its own (the API has no cancel), which the UI says.
 */
export function useGeneration() {
  const [state, setState] = React.useState<GenerationState>(initialGeneration);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const start = React.useCallback(async (request: GenerationRequest) => {
    const controller = new AbortController();
    abortRef.current = controller;
    let current: GenerationState = { ...initialGeneration, phase: "running" };
    setState(current);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        current = { ...current, phase: "error", error: res.status === 429 ? m.errors.rateLimited : m.errors.start };
        setState(current);
        return current;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const { data, rest } = takeSseData(buffer + decoder.decode(value, { stream: true }));
        buffer = rest;
        for (const payload of data) {
          let event: GenerationEvent;
          try {
            event = JSON.parse(payload) as GenerationEvent;
          } catch {
            continue;
          }
          current = applyGenerationEvent(current, event);
          setState(current);
        }
      }
      if (current.phase === "running") {
        current = { ...current, phase: "error", interrupted: true };
        setState(current);
      }
      return current;
    } catch (err) {
      if (controller.signal.aborted) {
        current = { ...current, phase: "cancelled" };
      } else {
        current = { ...current, phase: "error", error: err instanceof Error ? err.message : String(err) };
      }
      setState(current);
      return current;
    }
  }, []);

  const cancel = React.useCallback(() => abortRef.current?.abort(), []);
  const reset = React.useCallback(() => setState(initialGeneration), []);

  return { state, start, cancel, reset };
}
