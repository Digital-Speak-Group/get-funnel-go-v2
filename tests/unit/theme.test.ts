import { describe, it, expect } from "vitest";
import {
  ThemeTokensSchema,
  tokensToCssVars,
  getBackgroundStyles,
  defaultTheme,
  lightTheme,
  midnightTheme,
  editorialTheme,
  minimalTheme,
  systemThemes,
  type ThemeTokens,
} from "@/lib/slides/theme";

function validTheme(overrides: Partial<ThemeTokens> = {}): ThemeTokens {
  return {
    id: "test-theme",
    name: "Test Theme",
    color: {
      bg: "#09090b",
      surface: "#111118",
      text: "#fafafa",
      muted: "#a1a1aa",
      primary: "#470c85",
      primaryFg: "#ffffff",
      accent: "#8b5cf6",
      success: "#34d399",
      danger: "#f87171",
    },
    font: {
      display: "Inter, system-ui, sans-serif",
      body: "Inter, system-ui, sans-serif",
      scale: "regular",
    },
    radius: "soft",
    motion: "subtle",
    background: "solid",
    logoAssetId: undefined,
    ...overrides,
  };
}

describe("ThemeTokensSchema", () => {
  it("accepts valid theme", () => {
    expect(() => ThemeTokensSchema.parse(validTheme())).not.toThrow();
  });

  it("accepts defaultTheme", () => {
    expect(() => ThemeTokensSchema.parse(defaultTheme)).not.toThrow();
  });

  it("accepts lightTheme", () => {
    expect(() => ThemeTokensSchema.parse(lightTheme)).not.toThrow();
  });

  it("accepts midnightTheme", () => {
    expect(() => ThemeTokensSchema.parse(midnightTheme)).not.toThrow();
  });

  it("accepts editorialTheme", () => {
    expect(() => ThemeTokensSchema.parse(editorialTheme)).not.toThrow();
  });

  it("accepts minimalTheme", () => {
    expect(() => ThemeTokensSchema.parse(minimalTheme)).not.toThrow();
  });

  it("rejects invalid color format (missing #)", () => {
    const theme = validTheme({ color: { ...validTheme().color, bg: "09090b" } });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("rejects invalid color format (wrong length)", () => {
    const theme = validTheme({ color: { ...validTheme().color, bg: "#09090" } });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("rejects invalid color format (non-hex chars)", () => {
    const theme = validTheme({ color: { ...validTheme().color, bg: "#09090g" } });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("rejects invalid font scale", () => {
    const theme = validTheme({ font: { ...validTheme().font, scale: "huge" as any } });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("rejects invalid radius", () => {
    const theme = validTheme({ radius: "rounded" as any });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("rejects invalid motion", () => {
    const theme = validTheme({ motion: "wild" as any });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("rejects invalid background", () => {
    const theme = validTheme({ background: "pattern" as any });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("accepts valid logoAssetId", () => {
    const theme = validTheme({ logoAssetId: "00000000-0000-4000-8000-000000000001" });
    expect(() => ThemeTokensSchema.parse(theme)).not.toThrow();
  });

  it("rejects invalid logoAssetId", () => {
    const theme = validTheme({ logoAssetId: "not-a-uuid" });
    expect(() => ThemeTokensSchema.parse(theme)).toThrow();
  });

  it("accepts optional logoAssetId", () => {
    const theme = validTheme({ logoAssetId: undefined });
    expect(() => ThemeTokensSchema.parse(theme)).not.toThrow();
  });
});

describe("tokensToCssVars", () => {
  it("produces correct CSS variables for default theme", () => {
    const vars = tokensToCssVars(defaultTheme);

    expect(vars["--slide-bg"]).toBe("#09090b");
    expect(vars["--slide-surface"]).toBe("#111118");
    expect(vars["--slide-text"]).toBe("#fafafa");
    expect(vars["--slide-muted"]).toBe("#a1a1aa");
    expect(vars["--slide-primary"]).toBe("#470c85");
    expect(vars["--slide-primary-fg"]).toBe("#ffffff");
    expect(vars["--slide-accent"]).toBe("#8b5cf6");
    expect(vars["--slide-success"]).toBe("#34d399");
    expect(vars["--slide-danger"]).toBe("#f87171");
    expect(vars["--slide-radius"]).toBe("12px");
    expect(vars["--slide-motion-duration"]).toBe("150ms");
    expect(vars["--slide-font-display"]).toBe("Inter, system-ui, sans-serif");
    expect(vars["--slide-font-body"]).toBe("Inter, system-ui, sans-serif");
    expect(vars["--slide-font-scale"]).toBe("regular");
  });

  it("produces correct radius for sharp", () => {
    const theme = validTheme({ radius: "sharp" });
    const vars = tokensToCssVars(theme);
    expect(vars["--slide-radius"]).toBe("0");
  });

  it("produces correct radius for round", () => {
    const theme = validTheme({ radius: "round" });
    const vars = tokensToCssVars(theme);
    expect(vars["--slide-radius"]).toBe("9999px");
  });

  it("produces correct motion duration for none", () => {
    const theme = validTheme({ motion: "none" });
    const vars = tokensToCssVars(theme);
    expect(vars["--slide-motion-duration"]).toBe("0ms");
  });

  it("produces correct motion duration for expressive", () => {
    const theme = validTheme({ motion: "expressive" });
    const vars = tokensToCssVars(theme);
    expect(vars["--slide-motion-duration"]).toBe("300ms");
  });
});

describe("getBackgroundStyles", () => {
  it("returns empty object for solid", () => {
    const styles = getBackgroundStyles("solid");
    expect(styles).toEqual({});
  });

  it("returns grid styles", () => {
    const styles = getBackgroundStyles("grid");
    expect(styles.backgroundImage).toContain("linear-gradient");
    expect(styles.backgroundSize).toBe("24px 24px");
  });

  it("returns gradient styles", () => {
    const styles = getBackgroundStyles("gradient");
    expect(styles.background).toContain("radial-gradient");
  });

  it("returns noise styles", () => {
    const styles = getBackgroundStyles("noise");
    expect(styles.backgroundImage).toContain("feTurbulence");
  });
});

describe("systemThemes", () => {
  it("contains 5 themes", () => {
    expect(systemThemes).toHaveLength(5);
  });

  it("all themes have unique ids", () => {
    const ids = systemThemes.map((t) => t.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("all themes validate", () => {
    systemThemes.forEach((theme) => {
      expect(() => ThemeTokensSchema.parse(theme)).not.toThrow();
    });
  });

  it("includes expected theme ids", () => {
    const ids = systemThemes.map((t) => t.id);
    expect(ids).toContain("getfunnels-dark");
    expect(ids).toContain("getfunnels-light");
    expect(ids).toContain("midnight");
    expect(ids).toContain("editorial");
    expect(ids).toContain("minimal");
  });
});

describe("ThemeTokens type", () => {
  it("is usable for type annotations", () => {
    const theme: ThemeTokens = validTheme();
    expect(theme.id).toBe("test-theme");
    expect(theme.color.primary).toBe("#470c85");
  });
});

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const channels = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [light, dark] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

describe("contrast checks (WCAG AA >= 4.5:1 body text)", () => {
  const MIN_RATIO = 4.5;

  systemThemes.forEach((theme) => {
    describe(theme.id, () => {
      it("text on bg passes AA", () => {
        expect(contrastRatio(theme.color.text, theme.color.bg)).toBeGreaterThanOrEqual(MIN_RATIO);
      });

      it("text on surface passes AA", () => {
        expect(contrastRatio(theme.color.text, theme.color.surface)).toBeGreaterThanOrEqual(MIN_RATIO);
      });

      it("muted (secondary body text) on bg passes AA", () => {
        expect(contrastRatio(theme.color.muted, theme.color.bg)).toBeGreaterThanOrEqual(MIN_RATIO);
      });

      it("muted (secondary body text) on surface passes AA", () => {
        expect(contrastRatio(theme.color.muted, theme.color.surface)).toBeGreaterThanOrEqual(MIN_RATIO);
      });

      it("primaryFg on primary passes AA", () => {
        expect(contrastRatio(theme.color.primaryFg, theme.color.primary)).toBeGreaterThanOrEqual(MIN_RATIO);
      });
    });
  });
});