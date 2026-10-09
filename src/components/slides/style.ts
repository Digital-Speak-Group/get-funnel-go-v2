import type * as React from "react";

/** The CSS-var record slide components receive (`tokensToCssVars` output). */
type SlideTheme = Record<string, string>;

/** Card background: the theme surface, or frosted glass under the Signature kit. */
export function cardSurface(theme: SlideTheme): React.CSSProperties {
  const blur = theme["--slide-card-blur"] ?? "none";
  return {
    background: theme["--slide-card-bg"] ?? theme["--slide-surface"],
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
    boxShadow: theme["--slide-card-shadow"] ?? "none",
  };
}

/** Headline color, or the legacy white-to-translucent gradient clip when the theme asks for it. */
export function headlineFill(theme: SlideTheme, color: string): React.CSSProperties {
  if (theme["--slide-headline"] !== "gradient") return { color };
  return {
    color: "transparent",
    backgroundImage: theme["--slide-headline-image"],
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  };
}

/** Small uppercase label above a title: plain text, or the legacy pill badge. */
export function kickerStyle(theme: SlideTheme): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: theme["--slide-primary"],
  };
  if (theme["--slide-kicker"] !== "pill") return base;
  return {
    ...base,
    display: "inline-block",
    padding: "8px 20px",
    borderRadius: "9999px",
    color: theme["--slide-accent"],
    background: `${theme["--slide-primary"]}26`,
    border: `1px solid ${theme["--slide-primary"]}66`,
  };
}
