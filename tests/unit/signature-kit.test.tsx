import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ThemeTokensSchema, tokensToCssVars, defaultTheme, systemThemes } from "@/lib/slides/theme";
import { signatureThemes } from "@/lib/slides/signature-themes";
import { cardSurface, headlineFill, kickerStyle } from "@/components/slides/style";
import { SlideDecor } from "@/components/slides/SlideDecor";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { buildDefaultContent } from "@/lib/slides/defaults";
import { SYSTEM_THEME_IDS } from "../../scripts/seed/themes";

const signature = signatureThemes[0];

describe("theme style extension", () => {
  it("keeps themes without `style` valid (saved before the kit)", () => {
    expect(defaultTheme.style).toBeUndefined();
    expect(ThemeTokensSchema.safeParse(defaultTheme).success).toBe(true);
  });

  it("rejects unknown style values", () => {
    const bad = { ...signature, style: { ...signature.style, decor: "sparkles" } };
    expect(ThemeTokensSchema.safeParse(bad).success).toBe(false);
  });

  it("derives flat values for classic themes and glass values for Signature", () => {
    const flat = tokensToCssVars(defaultTheme);
    expect(flat["--slide-card-bg"]).toBe(defaultTheme.color.surface);
    expect(flat["--slide-card-blur"]).toBe("none");
    expect(flat["--slide-headline"]).toBe("solid");

    const glass = tokensToCssVars(signature);
    expect(glass["--slide-card-bg"]).toBe(`${signature.color.text}0a`);
    expect(glass["--slide-card-blur"]).toBe("blur(16px)");
    expect(glass["--slide-headline"]).toBe("gradient");
    expect(glass["--slide-kicker"]).toBe("pill");
  });
});

describe("slide style helpers", () => {
  const flat = tokensToCssVars(defaultTheme);
  const glass = tokensToCssVars(signature);

  it("headlineFill keeps the given color on solid themes and clips a gradient otherwise", () => {
    expect(headlineFill(flat, "#123456")).toEqual({ color: "#123456" });
    expect(headlineFill(glass, "#123456")).toMatchObject({ color: "transparent", backgroundClip: "text" });
  });

  it("headlineFill leaves room for the last line's descenders under a gradient", () => {
    expect(headlineFill(glass, "#123456").paddingBottom).toBe("0.15em");
    expect(headlineFill(flat, "#123456")).not.toHaveProperty("paddingBottom");
  });

  it("cardSurface uses the surface on flat themes and frosted glass on Signature", () => {
    expect(cardSurface(flat)).toMatchObject({ background: defaultTheme.color.surface, backdropFilter: "none" });
    expect(cardSurface(glass)).toMatchObject({ backdropFilter: "blur(16px)" });
  });

  it("cardSurface falls back to the raw surface var for older var records", () => {
    expect(cardSurface({ "--slide-surface": "#111111" }).background).toBe("#111111");
  });

  it("kickerStyle becomes a pill only under the signature decor", () => {
    expect(kickerStyle(flat).borderRadius).toBeUndefined();
    expect(kickerStyle(glass).borderRadius).toBe("9999px");
  });
});

describe("SlideDecor", () => {
  it("renders nothing for flat themes", () => {
    const { container } = render(<SlideDecor theme={defaultTheme} animate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders glows + grid for Signature and only breathes when animated", () => {
    const { rerender } = render(<SlideDecor theme={signature} animate={false} />);
    expect(screen.getByTestId("slide-decor-grid")).toBeInTheDocument();
    expect(screen.getByTestId("slide-decor").querySelector(".gf-slide-breathe")).toBeNull();
    rerender(<SlideDecor theme={signature} animate />);
    expect(screen.getByTestId("slide-decor").querySelector(".gf-slide-breathe")).not.toBeNull();
  });

  it("never breathes when the theme disables motion", () => {
    render(<SlideDecor theme={{ ...signature, motion: "none" }} animate />);
    expect(screen.getByTestId("slide-decor").querySelector(".gf-slide-breathe")).toBeNull();
  });
});

describe("SlideRenderer entrance", () => {
  const slide = { id: "00000000-0000-4000-8000-000000000001", position: 0, type: "cover" as const, content: { ...buildDefaultContent("cover"), title: "Titre" } };

  it("reveals only live slides with motion enabled", () => {
    const { container, rerender } = render(<SlideRenderer slide={slide} theme={signature} isActive />);
    expect(container.querySelector('[data-slide-reveal="on"]')).not.toBeNull();
    rerender(<SlideRenderer slide={slide} theme={signature} isActive={false} />);
    expect(container.querySelector('[data-slide-reveal="off"]')).not.toBeNull();
    rerender(<SlideRenderer slide={slide} theme={{ ...signature, motion: "none" }} isActive />);
    expect(container.querySelector('[data-slide-reveal="off"]')).not.toBeNull();
  });
});

describe("seeded theme references", () => {
  it("every system theme has a canonical seed UUID", () => {
    for (const theme of systemThemes) expect(SYSTEM_THEME_IDS[theme.id], theme.id).toBeDefined();
  });

  it("every template points at a seeded system theme", () => {
    const dir = resolve(process.cwd(), "scripts/seed/templates");
    const known = new Set(Object.values(SYSTEM_THEME_IDS));
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const { themeId } = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
      expect(known.has(themeId), file).toBe(true);
    }
  });
});
