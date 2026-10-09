import { z } from "zod";
import { signatureThemes } from "./signature-themes";

export const ThemeTokensSchema = z.object({
  id: z.string(),
  name: z.string().max(60),
  color: z.object({
    bg: z.string().regex(/^#[0-9a-f]{6}$/i),
    surface: z.string().regex(/^#[0-9a-f]{6}$/i),
    text: z.string().regex(/^#[0-9a-f]{6}$/i),
    muted: z.string().regex(/^#[0-9a-f]{6}$/i),
    primary: z.string().regex(/^#[0-9a-f]{6}$/i),
    primaryFg: z.string().regex(/^#[0-9a-f]{6}$/i),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    success: z.string().regex(/^#[0-9a-f]{6}$/i),
    danger: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
  font: z.object({
    display: z.string().max(80),
    body: z.string().max(80),
    scale: z.enum(["compact", "regular", "editorial"]),
  }),
  radius: z.enum(["sharp", "soft", "round"]),
  motion: z.enum(["none", "subtle", "expressive"]),
  background: z.enum(["solid", "grid", "gradient", "noise"]),
  logoAssetId: z.string().uuid().optional(),
  // Optional so themes saved before the Signature kit (Phase 6) still validate; absent = flat look.
  style: z
    .object({
      decor: z.enum(["none", "glow", "signature"]),
      surface: z.enum(["flat", "glass"]),
      headline: z.enum(["solid", "gradient"]),
    })
    .optional(),
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

const radiusMap: Record<ThemeTokens["radius"], string> = {
  sharp: "0",
  soft: "12px",
  round: "9999px",
};

const motionMap: Record<ThemeTokens["motion"], string> = {
  none: "0ms",
  subtle: "150ms",
  expressive: "300ms",
};

const backgroundStyles: Record<ThemeTokens["background"], React.CSSProperties> = {
  solid: {},
  grid: {
    backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
    backgroundSize: "24px 24px",
  },
  gradient: {
    background: "radial-gradient(ellipse at center, var(--color-surface) 0%, var(--color-bg) 70%)",
  },
  noise: {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
  },
};

export const FLAT_STYLE: NonNullable<ThemeTokens["style"]> = {
  decor: "none",
  surface: "flat",
  headline: "solid",
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Brand color for text (labels, highlights). Deep primaries like #470c85 are fills,
 * unreadable as text on dark canvases, so fall back to the accent, then the text color.
 */
function readablePrimary(theme: ThemeTokens): string {
  const { primary, accent, text, bg } = theme.color;
  if (contrast(primary, bg) >= 4.5) return primary;
  if (contrast(accent, bg) >= 4.5) return accent;
  return text;
}

/**
 * Derived look values, precomputed so slide components stay plain inline styles.
 * Colors are #rrggbb (schema-enforced), so a two-digit hex alpha suffix is valid.
 */
function styleVars(theme: ThemeTokens): Record<string, string> {
  const style = theme.style ?? FLAT_STYLE;
  const { text, surface, primary } = theme.color;
  const glass = style.surface === "glass";
  return {
    "--slide-card-bg": glass ? `${text}0a` : surface,
    "--slide-card-blur": glass ? "blur(16px)" : "none",
    "--slide-card-shadow": glass ? `inset 0 1px 0 ${text}14, 0 24px 64px -32px ${primary}80` : "none",
    "--slide-headline": style.headline,
    "--slide-headline-image": `linear-gradient(180deg, ${text} 0%, ${text}b3 100%)`,
    "--slide-kicker": style.decor === "signature" ? "pill" : "plain",
    "--slide-decor": style.decor,
    "--slide-primary-text": readablePrimary(theme),
  };
}

export function tokensToCssVars(theme: ThemeTokens): Record<string, string> {
  return {
    ...styleVars(theme),
    "--slide-bg": theme.color.bg,
    "--slide-surface": theme.color.surface,
    "--slide-text": theme.color.text,
    "--slide-muted": theme.color.muted,
    "--slide-primary": theme.color.primary,
    "--slide-primary-fg": theme.color.primaryFg,
    "--slide-accent": theme.color.accent,
    "--slide-success": theme.color.success,
    "--slide-danger": theme.color.danger,
    "--slide-radius": radiusMap[theme.radius],
    "--slide-motion-duration": motionMap[theme.motion],
    "--slide-font-display": theme.font.display,
    "--slide-font-body": theme.font.body,
    "--slide-font-scale": theme.font.scale,
  };
}

export function getBackgroundStyles(background: ThemeTokens["background"]): React.CSSProperties {
  return backgroundStyles[background];
}

export const defaultTheme: ThemeTokens = {
  id: "getfunnels-dark",
  name: "GetFunnels Dark",
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
};

export const lightTheme: ThemeTokens = {
  ...defaultTheme,
  id: "getfunnels-light",
  name: "GetFunnels Light",
  color: {
    bg: "#fafafa",
    surface: "#ffffff",
    text: "#09090b",
    muted: "#52525b",
    primary: "#470c85",
    primaryFg: "#ffffff",
    accent: "#8b5cf6",
    success: "#059669",
    danger: "#dc2626",
  },
  background: "solid",
};

export const midnightTheme: ThemeTokens = {
  ...defaultTheme,
  id: "midnight",
  name: "Midnight",
  color: {
    bg: "#020617",
    surface: "#0f172a",
    text: "#f1f5f9",
    muted: "#94a3b8",
    primary: "#1e3a8a",
    primaryFg: "#ffffff",
    accent: "#3b82f6",
    success: "#10b981",
    danger: "#ef4444",
  },
  font: {
    display: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    scale: "regular",
  },
  radius: "soft",
  motion: "subtle",
  background: "gradient",
};

export const editorialTheme: ThemeTokens = {
  ...defaultTheme,
  id: "editorial",
  name: "Editorial",
  color: {
    bg: "#fafaf9",
    surface: "#ffffff",
    text: "#1c1917",
    muted: "#78716c",
    primary: "#1c1917",
    primaryFg: "#fafaf9",
    accent: "#78716c",
    success: "#166534",
    danger: "#991b1b",
  },
  font: {
    display: "Georgia, serif",
    body: "Georgia, serif",
    scale: "editorial",
  },
  radius: "sharp",
  motion: "none",
  background: "solid",
};

export const minimalTheme: ThemeTokens = {
  ...defaultTheme,
  id: "minimal",
  name: "Minimal",
  color: {
    bg: "#ffffff",
    surface: "#fafafa",
    text: "#171717",
    muted: "#737373",
    primary: "#171717",
    primaryFg: "#ffffff",
    accent: "#525252",
    success: "#16a34a",
    danger: "#dc2626",
  },
  font: {
    display: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
    scale: "compact",
  },
  radius: "sharp",
  motion: "none",
  background: "grid",
};

export const systemThemes: ThemeTokens[] = [
  defaultTheme,
  lightTheme,
  midnightTheme,
  editorialTheme,
  minimalTheme,
  ...signatureThemes,
];