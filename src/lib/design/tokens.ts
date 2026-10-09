/**
 * Raw product token values for contexts that cannot read CSS variables
 * (viewport metadata, OG images rendered by Satori).
 * Source of truth is `src/styles/globals.css`; `tests/unit/design-tokens.test.ts` keeps them in sync.
 */
export const productTokens = {
  bg: "#0a0a0b",
  surface: "#111113",
  "surface-2": "#18181b",
  "surface-3": "#1f1f23",
  fg: "#ededef",
  "fg-muted": "#a1a1aa",
  "fg-faint": "#85858e",
  primary: "#6e56cf",
  "primary-hover": "#765dd3",
  "primary-fg": "#ffffff",
  brand: "#baa7ff",
  ring: "#7d66d9",
  success: "#3dd68c",
  warning: "#ffc53d",
  danger: "#ff6369",
  destructive: "#ce2c31",
  "destructive-fg": "#ffffff",
} as const;

export type ProductToken = keyof typeof productTokens;
