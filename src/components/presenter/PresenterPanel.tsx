"use client";

import * as React from "react";
import { BarChart2, FileText, StickyNote } from "lucide-react";
import type { Slide } from "@/lib/slides/schema";
import type { ThemeTokens } from "@/lib/slides/theme";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { cn } from "@/lib/utils";
import { ScriptPanel } from "./ScriptPanel";
import { MetricsPanel } from "./MetricsPanel";
import { BlanksInputs } from "./BlanksInputs";
import { PRESENTER_MESSAGES as m } from "./messages";

type Tab = "script" | "notes" | "metrics";

const TABS: { id: Tab; icon: typeof FileText }[] = [
  { id: "script", icon: FileText },
  { id: "notes", icon: StickyNote },
  { id: "metrics", icon: BarChart2 },
];

interface PresenterPanelProps {
  slides: Slide[];
  theme: ThemeTokens;
  index: number;
  onGoTo: (index: number) => void;
  slideSeconds: number[];
  elapsedSec: number;
  blankValues: Record<string, string[]>;
  onBlankValues: (slideId: string, values: string[]) => void;
}

/** Right panel: Script / Notes / Métriques tabs, then the slide strip. */
export function PresenterPanel({ slides, theme, index, onGoTo, slideSeconds, elapsedSec, blankValues, onBlankValues }: PresenterPanelProps) {
  const [tab, setTab] = React.useState<Tab>("script");
  const slide = slides[index];

  // Each slide/tab opens at the top of the panel, like the legacy script panel.
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
  }, [index, tab]);

  // Keep the current thumbnail in view as the deck advances.
  const activeThumbRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    activeThumbRef.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [index]);

  return (
    <aside aria-label={m.panelLabel} className="flex w-96 shrink-0 flex-col border-l border-border bg-surface">
      <div role="tablist" aria-label={m.panelLabel} className="flex shrink-0 border-b border-border">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-medium outline-none focus-visible:bg-surface-2",
              tab === id ? "border-primary text-foreground" : "border-transparent text-faint hover:text-muted-foreground"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {m.tabs[id]}
          </button>
        ))}
      </div>

      <div ref={panelRef} role="tabpanel" className="flex-1 overflow-y-auto p-4">
        {tab === "script" && (
          <div className="space-y-4">
            {slide.type === "blanks" && (
              <BlanksInputs slide={slide} values={blankValues[slide.id] ?? []} onChange={(values) => onBlankValues(slide.id, values)} />
            )}
            <ScriptPanel slide={slide} index={index} total={slides.length} />
          </div>
        )}
        {tab === "notes" && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">{m.notes.title}</p>
            {slide.notes ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{slide.notes}</p>
            ) : (
              <p className="text-sm italic text-faint">{m.notes.empty}</p>
            )}
          </div>
        )}
        {tab === "metrics" && <MetricsPanel slideSeconds={slideSeconds} slides={slides} currentIndex={index} elapsedSec={elapsedSec} />}
      </div>

      <div className="shrink-0 border-t border-border p-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1" data-testid="presenter-strip">
          {slides.map((s, i) => (
            <button
              key={s.id}
              ref={i === index ? activeThumbRef : undefined}
              type="button"
              onClick={() => onGoTo(i)}
              className={cn(
                "relative aspect-video w-20 shrink-0 overflow-hidden rounded border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === index ? "border-primary" : "border-transparent hover:border-border-strong"
              )}
              aria-label={m.strip.label(i + 1, s.type)}
              aria-current={i === index ? "true" : undefined}
            >
              <SlideThumbnail slide={s} theme={theme} className="absolute inset-0 h-full w-full" />
              <span className="absolute bottom-0 left-0 rounded-tr bg-background/80 px-1 font-mono text-[10px] text-muted-foreground">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
