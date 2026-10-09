import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { randomUUID } from "node:crypto";
import { SlideSchema, type Slide, type SlideType } from "@/lib/slides/schema";
import { SLIDE_LAYOUTS, assignLayouts, layoutsFor, validLayout } from "@/lib/slides/layouts";
import { getLayoutComponent } from "@/components/slides/layouts";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { LayoutPicker } from "@/components/app/editor/LayoutPicker";
import { EMPTY_EDITOR_CUE } from "@/components/app/editor/cue";
import { buildSavePayload, validateEditorSlide } from "@/components/app/editor/validation";
import { systemThemes } from "@/lib/slides/theme";
import { loadAllTemplates } from "../../scripts/seed/templates";

const theme = systemThemes[0];
const templates = loadAllTemplates();
const sample = (type: SlideType) => {
  for (const t of templates) {
    const found = t.slides.find((s) => s.type === type);
    if (found) return found;
  }
  throw new Error(`no template slide of type ${type}`);
};

describe("layout schema", () => {
  it("keeps slides without a layout valid and accepts each type's own layouts", () => {
    const cover = sample("cover");
    expect(SlideSchema.safeParse({ ...cover, layout: undefined }).success).toBe(true);
    for (const layout of SLIDE_LAYOUTS.cover) {
      expect(SlideSchema.safeParse({ ...cover, layout }).success, layout).toBe(true);
    }
  });

  it("rejects a layout of another type, and any layout on types without variants", () => {
    expect(SlideSchema.safeParse({ ...sample("cover"), layout: "timeline" }).success).toBe(false);
    expect(SlideSchema.safeParse({ ...sample("faq"), layout: "grid" }).success).toBe(false);
  });

  it("validLayout drops unknown stored values instead of failing the slide", () => {
    expect(validLayout("cover", "split")).toBe("split");
    expect(validLayout("cover", "timeline")).toBeUndefined();
    expect(validLayout("faq", "grid")).toBeUndefined();
    expect(validLayout("cover", null)).toBeUndefined();
  });
});

describe("assignLayouts", () => {
  const deck = (types: SlideType[]) => types.map((type) => ({ type, layout: undefined as string | undefined }));

  it("keeps the original look for the first slide of each type, then cycles", () => {
    const out = assignLayouts(deck(["cover", "kpi", "statement", "kpi", "statement", "kpi", "faq"]));
    expect(out.map((s) => s.layout)).toEqual(["center", "row", "center", "cards", "left", "hero", undefined]);
  });

  it("never gives two consecutive slides the same layout name", () => {
    // "center" is the first layout of cover, statement and cta; "grid" of problem and benefits.
    const types: SlideType[] = ["cover", "statement", "cta", "problem", "benefits", "flow", "flow", "flow", "flow"];
    const out = assignLayouts(deck(types));
    for (let i = 1; i < out.length; i++) {
      if (out[i].layout) expect(out[i].layout, `slide ${i}`).not.toBe(out[i - 1].layout);
    }
    expect(out.every((s) => s.layout === undefined || layoutsFor(s.type).includes(s.layout))).toBe(true);
  });

  it("is deterministic", () => {
    const types: SlideType[] = ["cover", "problem", "benefits", "proof", "cta"];
    expect(assignLayouts(deck(types))).toEqual(assignLayouts(deck(types)));
  });
});

describe("layout renderers", () => {
  it("exist for every non-default layout", () => {
    for (const [type, layouts] of Object.entries(SLIDE_LAYOUTS) as [SlideType, readonly string[]][]) {
      expect(getLayoutComponent(type, layouts[0]), `${type}/${layouts[0]} is the original`).toBeUndefined();
      for (const layout of layouts.slice(1)) {
        expect(getLayoutComponent(type, layout), `${type}/${layout}`).toBeDefined();
      }
    }
  });

  it("render every template slide of a layout type in every layout, keeping its content", () => {
    for (const t of templates) {
      for (const slide of t.slides) {
        const layouts = layoutsFor(slide.type);
        if (layouts.length === 0) continue;
        const headline = (slide.content as { headline?: string; title?: string }).headline ??
          (slide.content as { title?: string }).title;
        for (const layout of layouts) {
          const { container } = render(<SlideRenderer slide={{ ...slide, layout } as Slide} theme={theme} />);
          expect(container.textContent?.replace(/\s+/g, " "), `${t.slug} #${slide.position} ${layout}`).toContain(
            // Banner statements split the headline around the highlight; check its start.
            (headline ?? "").slice(0, 12)
          );
          cleanup();
        }
      }
    }
  });
});

describe("layout picker", () => {
  const editorSlide = {
    id: randomUUID(),
    position: 0,
    type: "kpi" as const,
    content: sample("kpi").content as Record<string, unknown>,
    notes: "",
    script: "",
    cue: EMPTY_EDITOR_CUE,
  };

  it("offers the type's layouts, marks the current one and switches without touching content", () => {
    const onChange = vi.fn();
    render(<LayoutPicker slide={editorSlide} theme={theme} onChange={onChange} />);
    expect(screen.getByTestId("layout-option-row")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("layout-option-hero"));
    expect(onChange).toHaveBeenCalledWith("hero");

    const switched = { ...editorSlide, layout: "hero" };
    expect(validateEditorSlide(switched)).toEqual({});
    expect(buildSavePayload(switched)).toMatchObject({ layout: "hero", content: editorSlide.content });
  });

  it("renders nothing for types without layouts", () => {
    const { container } = render(
      <LayoutPicker slide={{ ...editorSlide, type: "faq", content: sample("faq").content as Record<string, unknown> }} theme={theme} onChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
