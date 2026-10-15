"use client";

import * as React from "react";
import { SlideBackground } from "./backgrounds";
import { SlideDecor } from "./SlideDecor";
import { getSlideComponent, UnknownSlide } from "./registry";
import { getLayoutComponent } from "./layouts";
import { StaticSlideProvider, useLiveBlanks, useStaticSlide } from "./render-context";
import { SlideIllustration } from "./illustrations/Illustration";
import { SlideStyleBackground, parseSlideBackground } from "./SlideStyleBackground";
import { useSlideEditing } from "./editable";
import { tokensToCssVars, getBackgroundStyles } from "@/lib/slides/theme";
import { type Slide } from "@/lib/slides/schema";
import { type ThemeTokens } from "@/lib/slides/theme";

interface SlideRendererProps {
  slide: Slide;
  theme: ThemeTokens;
  isActive?: boolean;
  className?: string;
}

export function SlideRenderer({ slide, theme, isActive = false, className }: SlideRendererProps) {
  const cssVars = tokensToCssVars(theme);
  const bgStyles = getBackgroundStyles(theme.background);
  // A layout variant when the slide picks one; otherwise (or for an unknown layout) the original.
  const Component = getLayoutComponent(slide.type, slide.layout) ?? getSlideComponent(slide.type) ?? UnknownSlide;
  const liveValues = useLiveBlanks(slide.id);
  const isStatic = useStaticSlide();
  // Editable fields cannot live inside role="img" (its children are presentational).
  const editing = useSlideEditing();
  const background = parseSlideBackground((slide.content as { background?: unknown }).background);

  const style: React.CSSProperties = {
    ...cssVars,
    ...bgStyles,
    width: "1920px",
    height: "1080px",
    position: "relative",
    overflow: "hidden",
    backgroundColor: theme.color.bg,
    color: theme.color.text,
    fontFamily: theme.font.body,
    borderRadius: theme.radius === "sharp" ? "0" : theme.radius === "round" ? "9999px" : "12px",
    transition: isActive ? "opacity 450ms cubic-bezier(0.16, 1, 0.3, 1)" : "none",
    opacity: isActive ? 1 : 1,
  };

  return (
    <div
      className={className}
      style={style}
      role={editing ? "group" : "img"}
      aria-label={`Slide ${slide.type}: ${(slide.content as Record<string, unknown>).headline || (slide.content as Record<string, unknown>).title || "Sans titre"}`}
    >
      <SlideBackground background={theme.background}>
        {background && <SlideStyleBackground background={background} />}
        {/* A photo background replaces the theme's decorative shapes. */}
        {background?.kind !== "image" && <SlideDecor theme={theme} animate={isActive} />}
        <SlideIllustration
          name={(slide.content as { illustration?: unknown }).illustration}
          theme={cssVars}
          animate={isActive && !isStatic && theme.motion !== "none"}
        />
        {/* Keyed by slide so the staggered entrance replays on every slide change. */}
        <div
          key={slide.id}
          data-slide-reveal={isActive && theme.motion !== "none" ? "on" : "off"}
          style={{ height: "100%" }}
        >
          <Component content={slide.content} theme={cssVars} notes={slide.notes} script={slide.script} liveValues={liveValues} />
        </div>
      </SlideBackground>
    </div>
  );
}

interface ScaledSlideRendererProps {
  slide: Slide;
  theme: ThemeTokens;
  isActive?: boolean;
  scale?: number;
  className?: string;
}

export function ScaledSlideRenderer({ slide, theme, isActive, scale = 1, className }: ScaledSlideRendererProps) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: "1920px",
          height: "1080px",
        }}
      >
        <SlideRenderer slide={slide} theme={theme} isActive={isActive} />
      </div>
    </div>
  );
}

/**
 * Fits the 1920×1080 slide inside its parent, letterboxed and centered. Measures its own box
 * (several can be on one page, e.g. presenter current + next) and re-measures on any resize,
 * not just window resizes. `className` styles the 16:9 frame itself, so borders/rounding hug
 * the slide instead of the letterbox.
 */
export function AutoScaledSlideRenderer({
  slide,
  theme,
  isActive,
  className,
  staticPreview = false,
}: SlideRendererProps & { staticPreview?: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateScale = () => {
      const { width, height } = container.getBoundingClientRect();
      setScale(Math.min(width / 1920, height / 1080));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        className={className}
        style={{
          width: `${1920 * scale}px`,
          height: `${1080 * scale}px`,
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          // Hidden until measured, so the unscaled 1920px slide never flashes.
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: "1920px", height: "1080px" }}>
          {staticPreview ? (
            <StaticSlideProvider>
              <SlideRenderer slide={slide} theme={theme} isActive={isActive} />
            </StaticSlideProvider>
          ) : (
            <SlideRenderer slide={slide} theme={theme} isActive={isActive} />
          )}
        </div>
      </div>
    </div>
  );
}