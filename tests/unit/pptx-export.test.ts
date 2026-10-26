import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import JSZip from "jszip";
import { buildPptx, speakerNotes } from "@/server/services/pptx";

// 1×1 transparent PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

describe("speakerNotes", () => {
  it("orders the cue, script and notes like the presenter panel", () => {
    const text = speakerNotes({
      script: "Bonjour à tous.",
      notes: "Insister sur le ROI",
      cue: {
        tag: "ACCROCHE",
        durationSec: 90,
        punchline: "Le marché change.",
        bullets: ["Regarder la salle"],
        transition: "Passons au problème.",
        closing: "Des questions ?",
      },
    });

    expect(text).toBe(
      [
        "[ACCROCHE · 1 min 30]",
        "Accroche : Le marché change.",
        "Bonjour à tous.",
        "Conseils :\n- Regarder la salle",
        "Transition : Passons au problème.",
        "Conclusion : Des questions ?",
        "Notes : Insister sur le ROI",
      ].join("\n\n")
    );
  });

  it("leaves out empty parts", () => {
    expect(speakerNotes({ script: "  ", notes: null })).toBe("");
    expect(speakerNotes({ script: "Seul le script.", cue: { durationSec: 45 } })).toBe("[45 s]\n\nSeul le script.");
  });
});

describe("buildPptx", () => {
  it("writes one picture slide per capture, with speaker notes", async () => {
    const file = await buildPptx("Deck test", [
      { image: PNG, material: { script: "Script de la slide 1" } },
      { image: PNG, material: {} },
    ]);

    const zip = await JSZip.loadAsync(file);
    const names = Object.keys(zip.files);
    expect(names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))).toHaveLength(2);
    expect(names.some((n) => n.startsWith("ppt/media/") && n.endsWith(".png"))).toBe(true);

    const notes1 = await zip.file("ppt/notesSlides/notesSlide1.xml")!.async("string");
    expect(notes1).toContain("Script de la slide 1");
    const core = await zip.file("docProps/core.xml")!.async("string");
    expect(core).toContain("Deck test");
  });
});
