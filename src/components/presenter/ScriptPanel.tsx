import * as React from "react";
import { ArrowRight, Clock } from "lucide-react";
import type { Slide } from "@/lib/slides/schema";
import { formatTime } from "./pace";
import { PRESENTER_MESSAGES } from "./messages";
import { SLIDE_TYPE_LABELS } from "@/components/app/editor/messages";

const m = PRESENTER_MESSAGES.script;

/**
 * Script tab, laid out like the legacy panel: tag + target time, the punchline to open with,
 * the script body, then the hand-over to the next slide. Static on purpose (presenter view is
 * animation-free). Slides with only a plain `script` render just the body.
 */
export function ScriptPanel({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  const cue = slide.cue;
  const paragraphs = (slide.script ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4" data-testid="presenter-script">
      <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
        {cue?.tag && (
          <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 font-semibold uppercase tracking-wider text-brand">
            {cue.tag}
          </span>
        )}
        {cue?.durationSec !== undefined && (
          <span className="flex items-center gap-1 font-mono tabular-nums text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatTime(cue.durationSec)}
          </span>
        )}
        <span className="ml-auto">
          <span className="font-medium uppercase tracking-wide">{SLIDE_TYPE_LABELS[slide.type]}</span> · {index + 1} / {total}
        </span>
      </div>

      {cue?.punchline && (
        <p
          className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-base font-semibold leading-snug text-brand"
          data-testid="presenter-punchline"
        >
          « {cue.punchline} »
        </p>
      )}

      {paragraphs.length > 0 ? (
        <div className="space-y-3">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className={`whitespace-pre-wrap border-l-2 pl-3 text-[15px] leading-relaxed text-foreground ${
                i === 0 ? "border-primary" : "border-border"
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      ) : (
        !cue?.punchline && <p className="text-sm italic text-faint">{m.empty}</p>
      )}

      {cue?.transition && (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-border-strong bg-muted px-4 py-3"
          data-testid="presenter-transition"
        >
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-label={m.transition} />
          <p className="text-sm font-medium italic leading-relaxed text-foreground">{cue.transition}</p>
        </div>
      )}

      {cue?.closing && (
        <p className="rounded-xl border border-primary/40 bg-primary/20 px-4 py-2.5 text-center text-sm font-bold uppercase tracking-widest text-brand">
          {cue.closing}
        </p>
      )}

      {cue?.bullets && cue.bullets.length > 0 && (
        <details className="text-sm" data-testid="presenter-tips">
          <summary className="cursor-pointer py-1 text-xs uppercase tracking-wider text-faint hover:text-muted-foreground">
            {m.tips(cue.bullets.length)}
          </summary>
          <ul className="mt-1 space-y-1.5 pl-2">
            {cue.bullets.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-muted-foreground">
                <span className="mt-0.5 text-[10px] text-brand" aria-hidden="true">▸</span>
                {tip}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
