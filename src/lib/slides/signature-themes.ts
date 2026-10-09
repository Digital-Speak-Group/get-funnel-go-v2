import type { ThemeTokens } from "./theme";

/**
 * "GetFunnels Signature" kit (Phase 6, Task 58): the legacy deck look — near-black canvas,
 * breathing glows, faint grid, glass cards, gradient headlines, pill labels — with one accent
 * per legacy funnel (colors from the legacy DecksConfig).
 */
function signature(id: string, name: string, primary: string, accent: string): ThemeTokens {
  return {
    id,
    name,
    color: {
      bg: "#0a0a0f",
      surface: "#121218",
      text: "#fafafa",
      muted: "#a1a1aa",
      primary,
      primaryFg: "#ffffff",
      accent,
      success: "#34d399",
      danger: "#f87171",
    },
    font: {
      display: "var(--font-geist-sans), system-ui, sans-serif",
      body: "var(--font-geist-sans), system-ui, sans-serif",
      scale: "regular",
    },
    radius: "soft",
    motion: "expressive",
    background: "solid",
    style: { decor: "signature", surface: "glass", headline: "gradient" },
  };
}

export const signatureThemes: ThemeTokens[] = [
  signature("signature-violet", "Signature Violet", "#470c85", "#a78bfa"),
  signature("signature-lancement", "Signature Lancement", "#7c3aed", "#c4b5fd"),
  signature("signature-vsl", "Signature VSL", "#0e7490", "#22d3ee"),
  signature("signature-webinaire", "Signature Webinaire", "#065f46", "#34d399"),
  signature("signature-evergreen", "Signature Evergreen", "#92400e", "#fbbf24"),
  signature("signature-pay", "Signature Pay", "#be185d", "#f472b6"),
];
