/**
 * Generation progress as the wizard shows it, driven only by the events the existing
 * `/api/ai/generate` stream sends (no API change): RESERVING_CREDITS → EXTRACTING_BRIEF →
 * PLANNING_DECK → GENERATING_SLIDES (progress/total) → SAVING_DECK → DONE, or ERROR.
 */

export const STAGES = ["credits", "brief", "plan", "slides", "saving", "done"] as const;
export type Stage = (typeof STAGES)[number];

const STAGE_BY_STATUS: Record<string, Stage> = {
  RESERVING_CREDITS: "credits",
  EXTRACTING_BRIEF: "brief",
  PLANNING_DECK: "plan",
  GENERATING_SLIDES: "slides",
  SAVING_DECK: "saving",
  DONE: "done",
};

/** Server message when the plan's monthly budget is used up (`generateDeckFromScript`). */
export const INSUFFICIENT_CREDITS = "Insufficient AI credits";

export interface GenerationState {
  phase: "idle" | "running" | "done" | "error" | "cancelled";
  stage: Stage;
  slidesDone: number;
  slidesTotal: number;
  deckId?: string;
  error?: string;
  /** The failure is the plan limit: offer an upgrade instead of a retry. */
  limitHit?: boolean;
  /** The stream ended without DONE or ERROR: the outcome on the server is unknown. */
  interrupted?: boolean;
}

export const initialGeneration: GenerationState = { phase: "idle", stage: "credits", slidesDone: 0, slidesTotal: 0 };

export interface GenerationEvent {
  status?: string;
  progress?: number;
  total?: number;
  deckId?: string;
  error?: string;
}

export function applyGenerationEvent(state: GenerationState, event: GenerationEvent): GenerationState {
  if (event.status === "ERROR") {
    const error = event.error ?? "";
    return { ...state, phase: "error", error, limitHit: error.includes(INSUFFICIENT_CREDITS) };
  }
  const stage = event.status ? STAGE_BY_STATUS[event.status] : undefined;
  if (!stage) return state;
  if (stage === "done") return { ...state, stage, phase: "done", deckId: event.deckId };
  if (stage === "slides") {
    return {
      ...state,
      stage,
      slidesDone: event.progress ?? state.slidesDone,
      slidesTotal: event.total ?? state.slidesTotal,
    };
  }
  return { ...state, stage };
}

/** Each stage of the timeline is done, current or still to come. */
export function stageStatus(state: GenerationState, stage: Stage): "done" | "current" | "pending" {
  const current = STAGES.indexOf(state.stage);
  const index = STAGES.indexOf(stage);
  if (state.phase === "done" || index < current) return "done";
  return index === current ? "current" : "pending";
}
