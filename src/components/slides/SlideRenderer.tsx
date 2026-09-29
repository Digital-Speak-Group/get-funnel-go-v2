"use client";

import * as React from "react";
import { SlideBackground } from "./backgrounds";
import { getSlideComponent, UnknownSlide } from "./registry";
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
  const Component = getSlideComponent(slide.type) || UnknownSlide;

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
      role="img"
      aria-label={`Slide ${slide.type}: ${(slide.content as Record<string, unknown>).headline || (slide.content as Record<string, unknown>).title || "Sans titre"}`}
    >
      <SlideBackground background={theme.background}>
        <Component content={slide.content} theme={cssVars} notes={slide.notes} script={slide.script} />
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

export function AutoScaledSlideRenderer({ slide, theme, isActive, className }: SlideRendererProps) {
  if (typeof window === "undefined") {
    return <SlideRenderer slide={slide} theme={theme} isActive={isActive} className={className} />;
  }

  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const updateScale = () => {
      const container = document.querySelector(".slide-container");
      if (!container) return;
      const { width, height } = container.getBoundingClientRect();
      const scaleX = width / 1920;
      const scaleY = height / 1080;
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div className="slide-container" style={{ width: "100%", height: "100%" }}>
      <ScaledSlideRenderer slide={slide} theme={theme} isActive={isActive} scale={scale} className={className} />
    </div>
  );
}