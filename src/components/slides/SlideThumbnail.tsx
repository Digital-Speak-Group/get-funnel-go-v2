"use client";

import * as React from "react";
import { SlideRenderer } from "./SlideRenderer";
import { type Slide } from "@/lib/slides/schema";
import { type ThemeTokens } from "@/lib/slides/theme";
import { cn } from "@/lib/utils";

interface SlideThumbnailProps {
  slide: Slide;
  theme: ThemeTokens;
  className?: string;
}

export function SlideThumbnail({ slide, theme, className }: SlideThumbnailProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.1);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / 1920, height / 1080));
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      <div
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <SlideRenderer slide={slide} theme={theme} />
      </div>
    </div>
  );
}
