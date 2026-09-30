import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { SLIDE_TYPES, type SlideType } from "@/lib/slides/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";
import {
  buildSavePayload,
  validateEditorSlide,
  type EditorSlide,
} from "@/components/app/editor/validation";

function defaultSlide(type: SlideType = "cover"): EditorSlide {
  return {
    id: randomUUID(),
    position: 0,
    type,
    content: buildDefaultContent(type),
    notes: "",
    script: "",
  };
}

describe("validateEditorSlide", () => {
  it("accepts default content for every slide type", () => {
    for (const type of SLIDE_TYPES) {
      expect(validateEditorSlide(defaultSlide(type))).toEqual({});
    }
  });

  it("flags an over-limit cover title", () => {
    const slide = defaultSlide("cover");
    const errors = validateEditorSlide({
      ...slide,
      content: { ...slide.content, title: "x".repeat(121) },
    });
    expect(errors.title).toEqual(["Maximum 120 caractères."]);
  });

  it("flags a missing required headline", () => {
    const slide = defaultSlide("problem");
    const content = { ...slide.content };
    delete content.headline;
    const errors = validateEditorSlide({ ...slide, content });
    expect(errors.headline).toEqual(["Ce champ est requis."]);
  });

  it("treats empty optional strings as absent", () => {
    const slide = defaultSlide("cover");
    const errors = validateEditorSlide({
      ...slide,
      content: { ...slide.content, kicker: "" },
    });
    expect(errors).toEqual({});
  });

  it("flags an array past its schema maximum with a French message", () => {
    const slide = defaultSlide("problem");
    const painPoints = [
      ...(slide.content.painPoints as unknown[]),
      { title: "T", text: "T" },
      { title: "T", text: "T" },
      { title: "T", text: "T" },
    ];
    const errors = validateEditorSlide({
      ...slide,
      content: { ...slide.content, painPoints },
    });
    expect(errors.painPoints).toEqual(["Maximum 5 éléments."]);
  });

  it("flags an empty required field inside an array item by path", () => {
    const slide = defaultSlide("problem");
    const painPoints = [
      ...(slide.content.painPoints as Array<Record<string, unknown>>),
    ];
    painPoints[0] = { ...painPoints[0], title: "" };
    const errors = validateEditorSlide({
      ...slide,
      content: { ...slide.content, painPoints },
    });
    expect(errors["painPoints.0.title"]).toEqual([
      "Minimum 1 caractère.",
    ]);
  });

  it("flags notes over the 2000 character limit", () => {
    const errors = validateEditorSlide({
      ...defaultSlide(),
      notes: "a".repeat(2001),
    });
    expect(errors.notes).toEqual(["Maximum 2000 caractères."]);
  });
});

describe("buildSavePayload", () => {
  it("drops empty optional fields and keeps required values", () => {
    const slide = defaultSlide("cover");
    const payload = buildSavePayload({
      ...slide,
      content: { ...slide.content, subtitle: "" },
    });
    expect("subtitle" in payload.content).toBe(false);
    expect(payload.content.title).toBe("Nouveau titre");
    expect(payload.slideId).toBe(slide.id);
    expect(payload.notes).toBe("");
  });
});
