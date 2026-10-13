"use client";

import * as React from "react";

import { ChevronLeft, ChevronRight, Clock, Maximize, Pause, Play, SkipBack, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/app/patterns/StatusPill";
import type { ChannelStatus } from "@/lib/realtime/types";
import { CopyAudienceLinkButton } from "./CopyAudienceLinkButton";
import { formatTime } from "./pace";
import { PRESENTER_MESSAGES as m } from "./messages";

const LINK_PILL = { live: "live", connecting: "saving", offline: "error" } as const;

interface PresenterTopBarProps {
  title: string;
  presentToken: string;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  link: ChannelStatus;
  timer: { totalSeconds: number; running: boolean; toggle: () => void; reset: () => void };
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

/** Slide navigation · deck title · audience link state and copy · timer · fullscreen. */
export function PresenterTopBar({
  title,
  presentToken,
  index,
  total,
  onPrevious,
  onNext,
  link,
  timer,
  isFullscreen,
  onToggleFullscreen,
}: PresenterTopBarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-3">
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onPrevious} disabled={index === 0} aria-label={m.nav.previous}>
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span className="min-w-14 text-center font-mono text-sm tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onNext} disabled={index === total - 1} aria-label={m.nav.next}>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <h1 className="min-w-0 flex-1 truncate text-center text-small text-muted-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <StatusPill status={LINK_PILL[link]} data-testid="presenter-link-status" className="hidden md:inline-flex">
          {m.link[link]}
        </StatusPill>
        <CopyAudienceLinkButton presentToken={presentToken} className={buttonVariants({ variant: "ghost", size: "sm" })} />

        <div className="flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5" aria-label={m.timer.label}>
          <Clock className="size-3.5 text-faint" aria-hidden="true" />
          <span className="font-mono text-sm tabular-nums text-foreground" role="timer">
            {formatTime(timer.totalSeconds)}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={timer.toggle} aria-label={timer.running ? m.timer.pause : m.timer.start}>
            {timer.running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={timer.reset} aria-label={m.timer.reset}>
            <SkipBack aria-hidden="true" />
          </Button>
        </div>

        <Button type="button" variant="ghost" size="icon-sm" onClick={onToggleFullscreen} aria-label={m.fullscreen}>
          {isFullscreen ? <X aria-hidden="true" /> : <Maximize aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}
