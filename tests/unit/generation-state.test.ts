import { describe, it, expect } from "vitest";
import { applyGenerationEvent, initialGeneration, stageStatus, type GenerationState } from "@/components/app/wizard/generation-state";

const run = (...events: object[]): GenerationState =>
  events.reduce<GenerationState>((s, e) => applyGenerationEvent(s, e), { ...initialGeneration, phase: "running" });

describe("generation timeline state", () => {
  it("follows the stream's stages in order, with slide progress", () => {
    const s = run(
      { status: "RESERVING_CREDITS" },
      { status: "EXTRACTING_BRIEF" },
      { status: "PLANNING_DECK" },
      { status: "GENERATING_SLIDES", progress: 0 },
      { status: "GENERATING_SLIDES", progress: 3, total: 12 }
    );
    expect(s).toMatchObject({ phase: "running", stage: "slides", slidesDone: 3, slidesTotal: 12 });
    expect(stageStatus(s, "brief")).toBe("done");
    expect(stageStatus(s, "slides")).toBe("current");
    expect(stageStatus(s, "saving")).toBe("pending");
  });

  it("ends on DONE with the deck id, every stage done", () => {
    const s = run({ status: "SAVING_DECK" }, { status: "DONE", deckId: "d1" });
    expect(s).toMatchObject({ phase: "done", stage: "done", deckId: "d1" });
    expect(stageStatus(s, "done")).toBe("done");
  });

  it("flags the plan limit apart from other errors", () => {
    expect(run({ status: "ERROR", error: "Insufficient AI credits" })).toMatchObject({ phase: "error", limitHit: true });
    expect(run({ status: "ERROR", error: "Groq timeout" })).toMatchObject({ phase: "error", limitHit: false });
  });

  it("ignores unknown events", () => {
    const s = run({ status: "EXTRACTING_BRIEF" }, { status: "SOMETHING_NEW" }, { foo: 1 });
    expect(s.stage).toBe("brief");
  });
});
