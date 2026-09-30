"use client";

import * as React from "react";
import { type Slide } from "@/lib/slides/schema";
import { type ThemeTokens } from "@/lib/slides/theme";
import { AutoScaledSlideRenderer } from "@/components/slides/SlideRenderer";
import { usePresenterSync } from "@/hooks/useSyncedSlide";
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

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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

  // Publish current slide to audience
  usePresenterSync(deck.presentToken, currentIndex);

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

  const currentSlide = slides[currentIndex];
  const nextSlide = slides[currentIndex + 1] ?? null;

  if (!currentSlide) return null;

  const progress = ((currentIndex + 1) / slides.length) * 100;

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-white overflow-hidden">
      {/* ── Left panel: current slide canvas ── */}
      <div className="flex flex-col flex-1 min-w-0">
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
          <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-800">
            <AutoScaledSlideRenderer slide={currentSlide} theme={theme} isActive />
          </div>
        </div>

        {/* Next slide preview */}
        {nextSlide && (
          <div className="shrink-0 h-28 px-4 pb-3">
            <p className="text-xs text-zinc-500 mb-1 font-medium">SUIVANTE</p>
            <div
              className="h-full rounded-lg overflow-hidden border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
              onClick={() => goTo(currentIndex + 1)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && goTo(currentIndex + 1)}
              aria-label="Aller à la slide suivante"
            >
              <div className="w-full h-full">
                <AutoScaledSlideRenderer slide={nextSlide} theme={theme} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: script / notes / metrics ── */}
      <div className="w-80 shrink-0 flex flex-col border-l border-zinc-800 bg-zinc-900">
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
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "script" && (
            <ScriptPanel slide={currentSlide} index={currentIndex} total={slides.length} />
          )}
          {activeTab === "notes" && (
            <NotesPanel slide={currentSlide} />
          )}
          {activeTab === "metrics" && (
            <MetricsPanel metrics={slideMetrics} slides={slides} currentIndex={currentIndex} />
          )}
        </div>

        {/* Slide strip */}
        <div className="shrink-0 border-t border-zinc-800 p-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => goTo(i)}
                className={`shrink-0 w-14 h-8 rounded text-xs font-mono transition-colors ${
                  i === currentIndex
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
                aria-label={`Slide ${i + 1}: ${slide.type}`}
                aria-current={i === currentIndex ? "true" : undefined}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-panels ──────────────────────────────────────────────────────────────

function ScriptPanel({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-medium uppercase tracking-wide">{slide.type}</span>
        <span>·</span>
        <span>{index + 1} / {total}</span>
      </div>
      {slide.script ? (
        <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{slide.script}</p>
      ) : (
        <p className="text-sm text-zinc-600 italic">Aucun script pour cette slide.</p>
      )}
    </div>
  );
}

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

function MetricsPanel({
  metrics,
  slides,
  currentIndex,
}: {
  metrics: SlideMetric[];
  slides: Slide[];
  currentIndex: number;
}) {
  const totalSeconds = metrics.reduce((sum, m) => sum + m.seconds, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-zinc-800 px-3 py-2.5 flex justify-between items-center">
        <span className="text-xs text-zinc-400">Total</span>
        <span className="text-sm font-mono tabular-nums text-white">{formatTime(totalSeconds)}</span>
      </div>
      <div className="space-y-1.5">
        {slides.map((slide, i) => {
          const m = metrics[i];
          const secs = m?.seconds ?? 0;
          const pct = totalSeconds > 0 ? (secs / totalSeconds) * 100 : 0;
          return (
            <div key={slide.id} className={`rounded px-3 py-2 ${i === currentIndex ? "bg-zinc-800" : ""}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs ${i === currentIndex ? "text-white" : "text-zinc-400"}`}>
                  {i + 1}. {slide.type}
                </span>
                <span className="text-xs font-mono tabular-nums text-zinc-400">{formatTime(secs)}</span>
              </div>
              {totalSeconds > 0 && (
                <div className="h-0.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
