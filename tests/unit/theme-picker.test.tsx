import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemePicker } from "@/components/app/ThemePicker";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { systemThemes, defaultTheme } from "@/lib/slides/theme";
import { type Slide } from "@/lib/slides/schema";

const coverSlide: Slide = {
  id: "00000000-0000-4000-8000-000000000001",
  position: 0,
  type: "cover",
  content: { title: "Slide de test" },
};

describe("SlideThumbnail", () => {
  it("renders the slide content without ResizeObserver (fallback path)", () => {
    const { container } = render(<SlideThumbnail slide={coverSlide} theme={defaultTheme} />);
    expect(screen.getByText("Slide de test")).toBeInTheDocument();
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
  });

  it("scales the 1920x1080 canvas into the container", () => {
    const { container } = render(<SlideThumbnail slide={coverSlide} theme={defaultTheme} />);
    const canvas = container.querySelector('[role="img"]')?.parentElement as HTMLElement;
    expect(canvas).toHaveStyle({ width: "1920px", height: "1080px" });
    expect(canvas.style.transform).toContain("scale(");
  });

  it("applies the theme to the inner slide", () => {
    const { container } = render(<SlideThumbnail slide={coverSlide} theme={defaultTheme} />);
    const slideEl = container.querySelector('[role="img"]') as HTMLElement;
    expect(slideEl).toHaveStyle({ "--slide-bg": "#09090b" });
  });
});

describe("ThemePicker", () => {
  it("renders all 5 system themes", () => {
    render(<ThemePicker selectedThemeId="getfunnels-dark" onSelect={() => {}} />);
    for (const theme of systemThemes) {
      expect(screen.getByLabelText(`Sélectionner ${theme.name}`)).toBeInTheDocument();
    }
  });

  it("previews a live slide thumbnail per theme", () => {
    render(<ThemePicker selectedThemeId="getfunnels-dark" onSelect={() => {}} />);
    const previews = screen.getAllByText("Votre prochain deck de vente");
    expect(previews).toHaveLength(systemThemes.length);
  });

  it("calls onSelect when a theme is chosen", () => {
    const onSelect = vi.fn();
    render(<ThemePicker selectedThemeId="getfunnels-dark" onSelect={onSelect} />);
    fireEvent.click(screen.getByLabelText("Sélectionner Midnight"));
    expect(onSelect).toHaveBeenCalledWith("midnight");
  });

  it("marks the selected theme with aria-pressed", () => {
    render(<ThemePicker selectedThemeId="midnight" onSelect={() => {}} />);
    expect(screen.getByLabelText("Sélectionner Midnight")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Sélectionner Editorial")).toHaveAttribute("aria-pressed", "false");
  });
});
