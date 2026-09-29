import * as React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlideRenderer, ScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import { registerSlideComponent, getSlideComponent, hasSlideComponent, UnknownSlide } from "@/components/slides/registry";
import { defaultTheme } from "@/lib/slides/theme";
import { type Slide } from "@/lib/slides/schema";

const TestSlideComponent = ({ content }: { content: Record<string, unknown> }) => (
  <div data-testid="test-slide" style={{ padding: "24px" }}>
    <h1 data-testid="slide-title">{content.title as string}</h1>
  </div>
);

function makeSlide(type: "cover" = "cover", content: Record<string, unknown> = { title: "Test Slide" }): Slide {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    position: 0,
    type,
    content: content as Slide["content"],
    notes: "Notes",
    script: "Script",
  };
}

describe("Slide Registry", () => {
  beforeEach(() => {
    // Clear registry by re-importing (modules are cached, so we test the functions directly)
  });

  it("registers and retrieves a slide component", () => {
    registerSlideComponent("cover", TestSlideComponent);
    const component = getSlideComponent("cover");
    expect(component).toBe(TestSlideComponent);
  });

  it("returns undefined for unregistered type", () => {
    const component = getSlideComponent("nonexistent" as any);
    expect(component).toBeUndefined();
  });

  it("hasSlideComponent returns true for registered type", () => {
    registerSlideComponent("cover", TestSlideComponent);
    expect(hasSlideComponent("cover")).toBe(true);
  });

  it("hasSlideComponent returns false for unregistered type", () => {
    expect(hasSlideComponent("nonexistent" as any)).toBe(false);
  });

  it("UnknownSlide renders fallback", () => {
    render(<UnknownSlide content={{ title: "Unknown" }} theme={{}} />);
    expect(screen.getByText("Type de slide inconnu")).toBeInTheDocument();
    expect(screen.getByText("Aucun composant enregistré pour ce type")).toBeInTheDocument();
  });
});

describe("SlideRenderer", () => {
  beforeEach(() => {
    registerSlideComponent("cover", TestSlideComponent);
  });

  it("renders slide with correct dimensions", () => {
    const slide = makeSlide();
    const { container } = render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    const slideEl = container.firstChild as HTMLElement;
    expect(slideEl).toHaveStyle({ width: "1920px", height: "1080px" });
  });

  it("applies theme CSS variables", () => {
    const slide = makeSlide();
    const { container } = render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    const slideEl = container.firstChild as HTMLElement;
    expect(slideEl).toHaveStyle({ "--slide-bg": "#09090b" });
    expect(slideEl).toHaveStyle({ "--slide-primary": "#470c85" });
  });

  it("renders registered component with content", () => {
    const slide = makeSlide("cover", { title: "Mon Titre Personnalisé" });
    render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    expect(screen.getByTestId("slide-title")).toHaveTextContent("Mon Titre Personnalisé");
  });

  it("renders UnknownSlide for unregistered type", () => {
    const slide = makeSlide("nonexistent" as any, { headline: "Test" });
    render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    expect(screen.getByText("Type de slide inconnu")).toBeInTheDocument();
  });

  it("includes aria-label with slide info", () => {
    const slide = makeSlide("cover", { title: "Titre ARIA" });
    const { container } = render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    const slideEl = container.firstChild as HTMLElement;
    expect(slideEl).toHaveAttribute("aria-label", expect.stringContaining("Titre ARIA"));
  });

  it("sets background color from theme", () => {
    const slide = makeSlide();
    const { container } = render(<SlideRenderer slide={slide} theme={defaultTheme} />);
    const slideEl = container.firstChild as HTMLElement;
    expect(slideEl).toHaveStyle({ backgroundColor: "#09090b" });
  });
});

describe("ScaledSlideRenderer", () => {
  beforeEach(() => {
    registerSlideComponent("cover", TestSlideComponent);
  });

  it("scales slide content", () => {
    const slide = makeSlide();
    const { container } = render(<ScaledSlideRenderer slide={slide} theme={defaultTheme} scale={0.5} />);
    // The transform is on the inner wrapper div (2 levels deep: container > wrapper > inner > SlideRenderer)
    const innerDiv = container.querySelector("div > div > div") as HTMLElement;
    expect(innerDiv).toHaveStyle({ transform: "scale(0.5)", transformOrigin: "top center" });
  });

  it("centers scaled content", () => {
    const slide = makeSlide();
    const { container } = render(<ScaledSlideRenderer slide={slide} theme={defaultTheme} scale={0.5} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ display: "flex", justifyContent: "center", alignItems: "center" });
  });
});