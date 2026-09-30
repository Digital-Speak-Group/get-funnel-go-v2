"use client";

import * as React from "react";
import { type Slide } from "@/lib/slides/schema";
import { type ThemeTokens } from "@/lib/slides/theme";
import { AutoScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAudienceSync } from "@/hooks/useSyncedSlide";

interface AudienceViewProps {
  slides: Slide[];
  theme: ThemeTokens;
  /** Present token — used for realtime sync */
  presentToken: string;
  /** Initial slide index (defaults to 0) */
  initialIndex?: number;
}

export function AudienceView({ slides, theme, presentToken, initialIndex = 0 }: AudienceViewProps) {
  const [currentIndex, setCurrentIndex] = React.useState(
    Math.max(0, Math.min(initialIndex, slides.length - 1))
  );
  const [showControls, setShowControls] = React.useState(false);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow presenter in realtime
  const syncedIndex = useAudienceSync(presentToken);
  React.useEffect(() => {
    if (syncedIndex !== null) {
      setCurrentIndex(Math.max(0, Math.min(syncedIndex, slides.length - 1)));
    }
  }, [syncedIndex, slides.length]);

  const goTo = React.useCallback(
    (idx: number) => {
      setCurrentIndex(Math.max(0, Math.min(slides.length - 1, idx)));
    },
    [slides.length]
  );

  // Keyboard navigation (audience can also follow along manually)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goTo(currentIndex + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goTo(currentIndex - 1);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, goTo]);

  // Show controls briefly on mouse move
  const onMouseMove = React.useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const currentSlide = slides[currentIndex];
  if (!currentSlide) return null;

  return (
    <div
      className="w-screen h-screen overflow-hidden bg-black relative"
      onMouseMove={onMouseMove}
    >
      {/* Slide canvas — full bleed */}
      <div className="w-full h-full">
        <AutoScaledSlideRenderer slide={currentSlide} theme={theme} isActive />
      </div>

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/20 z-10">
        <div
          className="h-full bg-white/30 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Nav controls — fade in/out */}
      <div
        className={`absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 z-10 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
          aria-label="Slide précédente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="text-sm text-white/60 tabular-nums font-mono bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          onClick={() => goTo(currentIndex + 1)}
          disabled={currentIndex === slides.length - 1}
          className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 disabled:opacity-30 transition-colors"
          aria-label="Slide suivante"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
