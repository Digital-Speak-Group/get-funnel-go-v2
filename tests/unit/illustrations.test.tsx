import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SLIDE_TYPES, SlideSchema, slideDraftSchema, type Slide } from "@/lib/slides/schema";
import { buildDefaultContent } from "@/lib/slides/defaults";
import { ILLUSTRATIONS } from "@/lib/slides/illustrations";
import { systemThemes } from "@/lib/slides/theme";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { Illustration } from "@/components/slides/illustrations/Illustration";
import { IllustrationPicker } from "@/components/app/editor/IllustrationPicker";
import { SlideFields } from "@/components/app/editor/SlideFields";
import { EMPTY_EDITOR_CUE } from "@/components/app/editor/cue";
import { buildSavePayload } from "@/components/app/editor/validation";

const theme = systemThemes.find((t) => t.motion !== "none") ?? systemThemes[0];
const colors = { primary: theme.color.primary, accent: theme.color.accent, muted: theme.color.muted };

const statement = (illustration?: string): Slide =>
  ({ id: randomUUID(), position: 0, type: "statement", content: { headline: "Un système", ...(illustration ? { illustration } : {}) } }) as Slide;

describe("illustration schema", () => {
  it("is optional on every slide type and limited to the library", () => {
    for (const type of SLIDE_TYPES) {
      const content = buildDefaultContent(type);
      const slide = { id: randomUUID(), position: 0, type, content };
      expect(SlideSchema.safeParse(slide).success, type).toBe(true);
      expect(SlideSchema.safeParse({ ...slide, content: { ...content, illustration: "radar" } }).success, type).toBe(true);
      expect(SlideSchema.safeParse({ ...slide, content: { ...content, illustration: "unicorn" } }).success, type).toBe(false);
    }
  });

  it("is not asked of the AI", () => {
    const draft = slideDraftSchema("statement").shape.content as unknown as { shape: Record<string, unknown> };
    expect(draft.shape.illustration).toBeUndefined();
  });
});

describe("illustration rendering", () => {
  it("draws every illustration with the theme colours, never hard-coded ones", () => {
    for (const name of ILLUSTRATIONS) {
      const { container, unmount } = render(<Illustration name={name} colors={colors} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("data-illustration")).toBe(name);
      const used = new Set(
        Array.from(svg.querySelectorAll("[fill],[stroke],stop"))
          .flatMap((el) => [el.getAttribute("fill"), el.getAttribute("stroke"), el.getAttribute("stop-color")])
          .filter((v): v is string => !!v && v.startsWith("#"))
      );
      for (const color of used) expect([colors.primary, colors.accent, colors.muted], `${name}: ${color}`).toContain(color);
      unmount();
    }
  });

  it("only animates on a live slide; thumbnails and the presenter get the still drawing", () => {
    const slide = statement("radar");
    const live = render(<SlideRenderer slide={slide} theme={theme} isActive />);
    expect(live.container.querySelector('svg[data-illustration="radar"]')).toHaveClass("gfi-live");
    live.unmount();

    const presenter = render(<SlideRenderer slide={slide} theme={theme} />);
    expect(presenter.container.querySelector('svg[data-illustration="radar"]')).not.toHaveClass("gfi-live");
    presenter.unmount();

    const thumb = render(<SlideThumbnail slide={slide} theme={theme} />);
    expect(thumb.container.querySelector('svg[data-illustration="radar"]')).not.toHaveClass("gfi-live");
  });

  it("is never required: slides without one render no illustration layer", () => {
    const { container } = render(<SlideRenderer slide={statement()} theme={theme} isActive />);
    expect(container.querySelector("svg[data-illustration]")).toBeNull();
    expect(container).toHaveTextContent("Un système");
  });

  it("stops all motion under reduced motion", () => {
    const { container } = render(<Illustration name="packets" colors={colors} animate />);
    expect(container.querySelector("style")?.textContent).toMatch(/prefers-reduced-motion: reduce\)\{\.gfi-live \*\{animation:none!important\}/);
  });

  it("uses no hex colour in the illustration sources", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/slides/illustrations/shapes.tsx"), "utf-8");
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

describe("illustration picker", () => {
  it("sets and clears the slide's illustration, which survives save", () => {
    const onChange = vi.fn();
    const { rerender } = render(<IllustrationPicker theme={theme} onChange={onChange} />);
    expect(screen.getByTestId("illustration-option-none")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("illustration-option-honeycomb"));
    expect(onChange).toHaveBeenLastCalledWith("honeycomb");

    rerender(<IllustrationPicker value="honeycomb" theme={theme} onChange={onChange} />);
    expect(screen.getByTestId("illustration-option-honeycomb")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByTestId("illustration-option-none"));
    expect(onChange).toHaveBeenLastCalledWith(undefined);

    const payload = buildSavePayload({
      id: randomUUID(), position: 0, type: "statement",
      content: { headline: "H", illustration: "honeycomb" }, notes: "", script: "", cue: EMPTY_EDITOR_CUE,
    });
    expect(payload.content.illustration).toBe("honeycomb");
  });

  it("is not duplicated as a plain field", () => {
    render(
      <SlideFields
        slide={{ id: randomUUID(), position: 0, type: "statement", content: { headline: "H", illustration: "radar" }, notes: "", script: "", cue: EMPTY_EDITOR_CUE }}
        errors={{}}
        onChange={vi.fn()}
      />
    );
    expect(screen.queryByTestId("slide-field-illustration")).toBeNull();
  });
});
