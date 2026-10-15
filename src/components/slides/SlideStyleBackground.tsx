"use client";

import * as React from "react";
import { THEME_ROLE_VARS, type ThemeRole } from "@/lib/slides/free";
import { SlideBackgroundSchema, type SlideBackground } from "@/lib/slides/slide-style";
import { useAssetUrl } from "./asset-url";

const role = (r: ThemeRole) => `var(${THEME_ROLE_VARS[r]})`;

/** The slide's own background (Task 73), when it has a valid one; null otherwise. */
export function parseSlideBackground(value: unknown): SlideBackground | null {
  const parsed = SlideBackgroundSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Paints a slide's own background over the theme's (colour, gradient, or image under a veil of
 * the theme's background colour). Theme roles resolve through the slide's CSS variables.
 */
export function SlideStyleBackground({ background }: { background: SlideBackground }) {
  const assetUrl = useAssetUrl();
  const layer: React.CSSProperties = { position: "absolute", inset: 0 };
  // Below the theme decor (z-index -1) and the content, above the theme's own background.
  const root: React.CSSProperties = { ...layer, zIndex: -2 };

  if (background.kind === "color") return <div aria-hidden="true" data-slide-background="color" style={{ ...root, background: role(background.color) }} />;
  if (background.kind === "gradient") {
    return (
      <div
        aria-hidden="true"
        data-slide-background="gradient"
        style={{ ...root, background: `linear-gradient(${background.angle}deg, ${role(background.from)}, ${role(background.to)})` }}
      />
    );
  }
  return (
    <div aria-hidden="true" data-slide-background="image" style={{ ...root, background: role("bg") }}>
      {background.assetId && (
        // Plain <img>: slides render at a fixed 1920×1080 and are CSS-scaled (also in exports).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assetUrl(background.assetId)} alt="" style={{ ...layer, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ ...layer, background: role("bg"), opacity: background.overlay }} />
    </div>
  );
}
