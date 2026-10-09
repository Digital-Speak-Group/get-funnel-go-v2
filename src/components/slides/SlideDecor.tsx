import * as React from "react";
import type { ThemeTokens } from "@/lib/slides/theme";

interface SlideDecorProps {
  theme: ThemeTokens;
  /** Live slide (presenter/audience): "breathing" glows. Thumbnails and the editor stay still. */
  animate: boolean;
}

/**
 * The legacy deck atmosphere, driven by `theme.style.decor`: soft primary/accent glows,
 * plus (signature) a faint grid that fades toward the edges. Sits behind slide content
 * (z-index -1 inside SlideBackground's stacking context) and never intercepts pointer events.
 */
export function SlideDecor({ theme, animate }: SlideDecorProps) {
  const decor = theme.style?.decor ?? "none";
  if (decor === "none") return null;

  const { primary, accent, text } = theme.color;
  const breathe = animate && theme.motion !== "none" ? "gf-slide-breathe" : undefined;

  return (
    <div aria-hidden="true" data-testid="slide-decor" style={{ position: "absolute", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}>
      <div
        className={breathe}
        style={{
          position: "absolute",
          top: "-360px",
          left: "-240px",
          width: "1100px",
          height: "1100px",
          background: `radial-gradient(circle, ${primary}8c 0%, ${primary}00 62%)`,
        }}
      />
      <div
        className={breathe}
        style={{
          position: "absolute",
          bottom: "-420px",
          right: "-260px",
          width: "1000px",
          height: "1000px",
          background: `radial-gradient(circle, ${accent}4d 0%, ${accent}00 60%)`,
          animationDelay: "-6s",
        }}
      />
      {decor === "signature" && (
        <div
          data-testid="slide-decor-grid"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${text}0d 1px, transparent 1px), linear-gradient(90deg, ${text}0d 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 65% at 50% 45%, #000 30%, transparent 100%)",
          }}
        />
      )}
    </div>
  );
}
