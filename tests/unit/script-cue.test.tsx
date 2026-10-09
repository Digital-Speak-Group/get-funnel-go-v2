import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { randomUUID } from "node:crypto";
import { SlideSchema, parseScriptCue, slideDraftSchema, type Slide } from "@/lib/slides/schema";
import { computePace } from "@/components/presenter/pace";
import { ScriptPanel } from "@/components/presenter/ScriptPanel";
import { MetricsPanel } from "@/components/presenter/MetricsPanel";
import { EMPTY_EDITOR_CUE, toEditorCue, toScriptCue } from "@/components/app/editor/cue";
import { buildSavePayload, validateEditorSlide } from "@/components/app/editor/validation";
import { loadAllTemplates } from "../../scripts/seed/templates";

function slide(overrides: Partial<Slide> = {}): Slide {
  return {
    id: randomUUID(),
    position: 0,
    type: "statement",
    content: { headline: "Titre" },
    ...overrides,
  } as Slide;
}

const CUE = {
  punchline: "Ton problème c'est le système.",
  durationSec: 120,
  tag: "VERDICT",
  transition: "Je te montre qui je suis.",
  bullets: ["Pause", "Regard caméra"],
  closing: "Clique. Et on avance.",
};

describe("ScriptCueSchema on slides", () => {
  it("keeps plain-string scripts valid (backward compatible)", () => {
    expect(SlideSchema.safeParse(slide({ script: "Bonjour." })).success).toBe(true);
  });

  it("accepts a structured cue and rejects a bad one", () => {
    expect(SlideSchema.safeParse(slide({ script: "Corps.", cue: CUE })).success).toBe(true);
    expect(SlideSchema.safeParse(slide({ cue: { ...CUE, durationSec: 0 } })).success).toBe(false);
    expect(SlideSchema.safeParse(slide({ cue: { ...CUE, punchline: "" } })).success).toBe(false);
  });

  it("parseScriptCue drops an invalid stored cue instead of throwing", () => {
    expect(parseScriptCue(CUE)).toEqual(CUE);
    expect(parseScriptCue(null)).toBeUndefined();
    expect(parseScriptCue({ durationSec: "2 min" })).toBeUndefined();
  });

  it("keeps the cue out of the AI draft schema", () => {
    const shape = slideDraftSchema("statement").shape as Record<string, unknown>;
    expect(shape.cue).toBeUndefined();
    expect(shape.script).toBeDefined();
  });
});

describe("computePace", () => {
  const deck = [60, 120, 0, 30].map((d, position) =>
    slide({ position, cue: d ? { durationSec: d } : undefined })
  );

  it("sums slide durations into the target and counts untimed slides", () => {
    expect(computePace(deck, 0, 0)).toMatchObject({ targetSec: 210, untimedSlides: 1 });
  });

  it("is on track inside the current slide's window", () => {
    expect(computePace(deck, 1, 60)?.status).toBe("on-track");
    expect(computePace(deck, 1, 180)?.status).toBe("on-track");
  });

  it("is behind past the window and ahead before it", () => {
    expect(computePace(deck, 1, 200)).toMatchObject({ status: "behind", deltaSec: 20 });
    expect(computePace(deck, 3, 100)).toMatchObject({ status: "ahead", deltaSec: 80 });
  });

  it("returns null when no slide has a duration", () => {
    expect(computePace([slide(), slide({ position: 1 })], 0, 30)).toBeNull();
  });
});

describe("editor cue conversion", () => {
  it("round-trips a cue through the editor inputs", () => {
    expect(toScriptCue(toEditorCue(CUE))).toEqual(CUE);
  });

  it("drops blanks and returns null for an empty cue", () => {
    expect(toScriptCue(EMPTY_EDITOR_CUE)).toBeNull();
    expect(toScriptCue({ ...EMPTY_EDITOR_CUE, tag: "  ", bullets: "\nUn\n\n Deux \n" })).toEqual({
      bullets: ["Un", "Deux"],
    });
  });

  it("keeps a non-numeric duration so validation can flag it", () => {
    const cue = toScriptCue({ ...EMPTY_EDITOR_CUE, durationSec: "abc" });
    expect(Number.isNaN(cue?.durationSec)).toBe(true);
    expect(SlideSchema.safeParse(slide({ cue: cue ?? undefined })).success).toBe(false);
  });

  it("reports cue errors on their field and saves the cue", () => {
    const editorSlide = {
      id: randomUUID(),
      position: 0,
      type: "statement" as const,
      content: { headline: "Titre" },
      notes: "",
      script: "",
      cue: { ...EMPTY_EDITOR_CUE, durationSec: "2" },
    };
    expect(validateEditorSlide(editorSlide)).toEqual({ "cue.durationSec": ["Minimum 5."] });
    for (const durationSec of ["abc", "2.5"]) {
      expect(validateEditorSlide({ ...editorSlide, cue: { ...EMPTY_EDITOR_CUE, durationSec } })).toEqual({
        "cue.durationSec": ["Entrez un nombre entier."],
      });
    }
    const valid = { ...editorSlide, cue: toEditorCue(CUE) };
    expect(validateEditorSlide(valid)).toEqual({});
    expect(buildSavePayload(valid).cue).toEqual(CUE);
    expect(buildSavePayload({ ...valid, cue: EMPTY_EDITOR_CUE }).cue).toBeNull();
  });
});

describe("presenter panels", () => {
  it("renders a plain-string script without cue chrome", () => {
    render(<ScriptPanel slide={slide({ script: "Premier.\n\nSecond." })} index={0} total={3} />);
    expect(screen.getByText("Premier.")).toBeInTheDocument();
    expect(screen.getByText("Second.")).toBeInTheDocument();
    expect(screen.queryByTestId("presenter-punchline")).toBeNull();
    expect(screen.queryByTestId("presenter-transition")).toBeNull();
  });

  it("renders the structured parts of a cue", () => {
    render(<ScriptPanel slide={slide({ script: "Corps.", cue: CUE })} index={1} total={3} />);
    expect(screen.getByTestId("presenter-punchline")).toHaveTextContent(CUE.punchline);
    expect(screen.getByTestId("presenter-transition")).toHaveTextContent(CUE.transition);
    expect(screen.getByText("VERDICT")).toBeInTheDocument();
    expect(screen.getByText("02:00")).toBeInTheDocument();
    expect(screen.getByTestId("presenter-tips")).toHaveTextContent("Regard caméra");
    expect(screen.getByText(CUE.closing)).toBeInTheDocument();
  });

  it("shows the pace against the target in the stats tab", () => {
    const slides = [slide({ cue: { durationSec: 60 } }), slide({ position: 1, cue: { durationSec: 60 } })];
    render(<MetricsPanel slides={slides} slideSeconds={[90, 0]} currentIndex={0} elapsedSec={90} />);
    expect(screen.getByTestId("presenter-pace")).toHaveAttribute("data-status", "behind");
    expect(screen.getByTestId("presenter-pace")).toHaveTextContent("En retard de 00:30");
  });
});

describe("ported legacy cues", () => {
  const SCRIPTED = ["rdv-classique", "vsl-funnel", "tunnel-pay", "tunnel-webinaire", "lancement-orchestre", "evergreen"];
  const templates = loadAllTemplates().filter((t) => SCRIPTED.includes(t.slug));

  it("covers the 6 scripted legacy decks", () => {
    expect(templates.map((t) => t.slug).sort()).toEqual([...SCRIPTED].sort());
  });

  it("gives every slide a punchline and a target duration", () => {
    for (const t of templates) {
      const missing = t.slides.filter((s) => !s.cue?.punchline || !s.cue?.durationSec).map((s) => s.position);
      expect(missing, t.slug).toEqual([]);
    }
  });
});
