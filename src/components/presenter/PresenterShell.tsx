"use client";

import * as React from "react";
import { type Slide } from "@/lib/slides/schema";
import { type ThemeTokens } from "@/lib/slides/theme";
import { AutoScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { usePresenterSync } from "@/hooks/useSyncedSlide";
import { ScriptPanel } from "./ScriptPanel";
import { MetricsPanel } from "./MetricsPanel";
import { formatTime } from "./pace";
import { PRESENTER_MESSAGES } from "./messages";
import { BlanksInputs } from "./BlanksInputs";
import { CopyAudienceLinkButton } from "./CopyAudienceLinkButton";
import { LiveBlanksProvider } from "@/components/slides/render-context";
import {
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Maximize,
  X,
  Clock,
  FileText,
  StickyNote,
  BarChart2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SlideMetric {
  slideIndex: number;
  seconds: number;
}

type PanelTab = "script" | "notes" | "metrics";

interface PresenterShellProps {
  deck: { id: string; title: string; presentToken: string };
  slides: Slide[];
  theme: ThemeTokens;
}

// ─── Timer hook ─────────────────────────────────────────────────────────────

function useTimer() {
  const [totalSeconds, setTotalSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const start = React.useCallback(() => {
    if (running) return;
    setRunning(true);
  }, [running]);

  const pause = React.useCallback(() => setRunning(false), []);

  const reset = React.useCallback(() => {
    setRunning(false);
    setTotalSeconds(0);
  }, []);

  React.useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTotalSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  return { totalSeconds, running, start, pause, reset };
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PresenterShell({ deck, slides, theme }: PresenterShellProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<PanelTab>("script");
  const [slideMetrics, setSlideMetrics] = React.useState<SlideMetric[]>(() =>
    slides.map((_, i) => ({ slideIndex: i, seconds: 0 }))
  );

  const timer = useTimer();
  const slideTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = React.useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Live values of blanks slides, by slide id: in memory only, broadcast with each sync event.
  const [blankValues, setBlankValues] = React.useState<Record<string, string[]>>({});
  const currentId = slides[currentIndex]?.id;
  const currentBlanks = currentId && slides[currentIndex]?.type === "blanks"
    ? { slideId: currentId, values: blankValues[currentId] ?? [] }
    : undefined;

  // Publish current slide to audience
  usePresenterSync(deck.presentToken, currentIndex, true, currentBlanks);

  // Per-slide time tracking
  React.useEffect(() => {
    if (timer.running) {
      slideTimerRef.current = setInterval(() => {
        setSlideMetrics((prev) => {
          const next = [...prev];
          next[currentIndexRef.current] = {
            slideIndex: currentIndexRef.current,
            seconds: (next[currentIndexRef.current]?.seconds ?? 0) + 1,
          };
          return next;
        });
      }, 1000);
    } else {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    }
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [timer.running]);

  const goTo = React.useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, idx));
      setCurrentIndex(clamped);
    },
    [slides.length]
  );

  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case " ":
          e.preventDefault();
          goTo(currentIndexRef.current + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goTo(currentIndexRef.current - 1);
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(slides.length - 1);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "p":
        case "P":
          e.preventDefault();
          if (timer.running) {
            timer.pause();
          } else {
            timer.start();
          }
          break;
        case "Escape":
          if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goTo, isFullscreen, slides.length, timer, toggleFullscreen]);

  // Fullscreen change listener
  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Each slide/tab opens at the top of the side panel, like the legacy script panel.
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [currentIndex, activeTab]);

  // Keep the current slide's thumbnail visible in the strip as the deck advances.
  const activeThumbRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    activeThumbRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [currentIndex]);

  const currentSlide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1] ?? null;

  if (!currentSlide) return null;

  const progress = ((currentIndex + 1) / slides.length) * 100;

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-white overflow-hidden">
      {/* ── Left panel: current slide canvas ── */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Top controls bar */}
        <div className="flex items-center justify-between px-4 h-12 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              aria-label="Slide précédente (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-mono tabular-nums text-zinc-300">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === slides.length - 1}
              className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
              aria-label="Slide suivante (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h1 className="text-sm font-medium text-zinc-400 truncate max-w-xs">{deck.title}</h1>

          <div className="flex items-center gap-2">
            <CopyAudienceLinkButton
              presentToken={deck.presentToken}
              className="rounded px-2.5 py-1 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            />

            {/* Timer */}
            <div className="flex items-center gap-1.5 bg-zinc-800 rounded px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-sm font-mono tabular-nums">{formatTime(timer.totalSeconds)}</span>
              <button
                onClick={timer.running ? timer.pause : timer.start}
                className="ml-1 p-0.5 rounded hover:bg-zinc-700 transition-colors"
                aria-label={timer.running ? "Pause (P)" : "Démarrer (P)"}
              >
                {timer.running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                onClick={timer.reset}
                className="p-0.5 rounded hover:bg-zinc-700 transition-colors"
                aria-label="Réinitialiser le timer"
              >
                <SkipBack className="h-3 w-3" />
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-zinc-800 transition-colors"
              aria-label="Plein écran (F)"
            >
              {isFullscreen ? <X className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-zinc-800 shrink-0">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current slide */}
        <div className="flex-1 min-h-0 p-4">
          {/* Not `isActive`: the presenter view stays animation-free (docs/design-system.md → Motion). */}
          <LiveBlanksProvider values={blankValues}>
            <AutoScaledSlideRenderer
              slide={currentSlide}
              theme={theme}
              className="rounded-xl border border-zinc-800"
            />
          </LiveBlanksProvider>
        </div>

        {/* Next slide preview */}
        {nextSlide && (
          <div className="shrink-0 h-28 px-4 pb-3">
            <p className="text-xs text-zinc-500 mb-1 font-medium">SUIVANTE</p>
            <div
              className="group h-full cursor-pointer"
              onClick={() => goTo(currentIndex + 1)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && goTo(currentIndex + 1)}
              aria-label="Aller à la slide suivante"
            >
              <AutoScaledSlideRenderer
                slide={nextSlide}
                theme={theme}
                staticPreview
                className="rounded-lg border border-zinc-800 transition-colors group-hover:border-zinc-600"
              />
            </div>
          </div>
        )}
      </main>

      {/* ── Right panel: script / notes / metrics ── */}
      <aside
        aria-label={PRESENTER_MESSAGES.panelLabel}
        className="w-96 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-900"
      >
        {/* Tab bar */}
        <div className="flex border-b border-zinc-800 shrink-0">
          {(
            [
              { id: "script" as const, label: "Script", icon: FileText },
              { id: "notes" as const, label: "Notes", icon: StickyNote },
              { id: "metrics" as const, label: "Temps", icon: BarChart2 },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                activeTab === id
                  ? "text-white border-b-2 border-violet-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div ref={panelRef} className="flex-1 overflow-y-auto p-4">
          {activeTab === "script" && (
            <div className="space-y-4">
              {currentSlide.type === "blanks" && (
                <BlanksInputs
                  slide={currentSlide}
                  values={blankValues[currentSlide.id] ?? []}
                  onChange={(values) => setBlankValues((prev) => ({ ...prev, [currentSlide.id]: values }))}
                />
              )}
              <ScriptPanel slide={currentSlide} index={currentIndex} total={slides.length} />
            </div>
          )}
          {activeTab === "notes" && (
            <NotesPanel slide={currentSlide} />
          )}
          {activeTab === "metrics" && (
            <MetricsPanel
              slideSeconds={slideMetrics.map((m) => m.seconds)}
              slides={slides}
              currentIndex={currentIndex}
              elapsedSec={timer.totalSeconds}
            />
          )}
        </div>

        {/* Slide strip: real thumbnails, current one kept in view */}
        <div className="shrink-0 border-t border-zinc-800 p-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1" data-testid="presenter-strip">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                ref={i === currentIndex ? activeThumbRef : undefined}
                onClick={() => goTo(i)}
                className={`relative shrink-0 w-20 aspect-video overflow-hidden rounded border-2 transition-colors ${
                  i === currentIndex ? "border-violet-500" : "border-transparent hover:border-zinc-600"
                }`}
                aria-label={PRESENTER_MESSAGES.strip.label(i + 1, slide.type)}
                aria-current={i === currentIndex ? "true" : undefined}
              >
                <SlideThumbnail slide={slide} theme={theme} className="absolute inset-0 h-full w-full" />
                <span className="absolute bottom-0 left-0 rounded-tr bg-zinc-950/80 px-1 text-[10px] font-mono text-zinc-300">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function NotesPanel({ slide }: { slide: Slide }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Notes présentateur</p>
      {slide.notes ? (
        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{slide.notes}</p>
      ) : (
        <p className="text-sm text-zinc-600 italic">Aucune note pour cette slide.</p>
      )}
    </div>
  );
}
