"use client";

import * as React from "react";
import { getRealtimeProvider } from "@/lib/realtime/supabase";
import type { ChannelStatus, RealtimeChannel, SlideEvent } from "@/lib/realtime/types";
import { parseBlanksPayload } from "@/lib/realtime/blanks";

/** Typing in a blank publishes once the presenter pauses (also keeps clear of the 100 ms throttle). */
const BLANKS_DEBOUNCE_MS = 300;
/**
 * Broadcasts are not stored: an audience that joins after the last change would wait for the
 * next one. The presenter repeats where it is this often, so late joiners catch up.
 */
const HEARTBEAT_MS = 3000;

/**
 * Presenter-side hook: publishes the current slide index to the realtime channel.
 * Call this in PresenterShell with the presentToken and the current index.
 *
 * @param presentToken  - The deck's presentToken (used as channel key)
 * @param slideIndex    - The current slide index to publish
 * @param enabled       - Set to false to disable sync (e.g. during offline editing)
 * @param blanks        - Live values of the current slide when it is a `blanks` slide
 * @param step          - Build steps revealed on the current slide (Task 75)
 */
export function usePresenterSync(
  presentToken: string,
  slideIndex: number,
  enabled = true,
  blanks?: SlideEvent["blanks"],
  step = 0
): ChannelStatus {
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = React.useState<ChannelStatus>("connecting");

  React.useEffect(() => {
    if (!enabled) return;
    const provider = getRealtimeProvider();
    const ch = provider.channel(presentToken);
    channelRef.current = ch;
    const stopStatus = ch.onStatus?.(setStatus);
    return () => {
      stopStatus?.();
      ch.destroy();
      channelRef.current = null;
    };
  }, [presentToken, enabled]);

  // Every event carries the current slide's blank values, so a slide change also resends them.
  const blanksRef = React.useRef(blanks);
  blanksRef.current = blanks;

  const stepRef = React.useRef(step);
  stepRef.current = step;

  // Publish on every slide or build-step change, and again once the channel is joined: a
  // message sent while still connecting may not reach audiences that are already waiting.
  const isLive = status === "live";
  React.useEffect(() => {
    if (!enabled || !channelRef.current) return;
    channelRef.current.publish({ slideIndex, step, ts: Date.now(), blanks: blanksRef.current });
  }, [slideIndex, step, enabled, isLive]);

  React.useEffect(() => {
    if (!enabled || !isLive) return;
    const timer = setInterval(() => {
      channelRef.current?.publish({ slideIndex, step, ts: Date.now(), blanks: blanksRef.current });
    }, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [slideIndex, step, enabled, isLive]);

  // Publish typed values after a short pause
  const blanksKey = blanks ? JSON.stringify(blanks) : "";
  React.useEffect(() => {
    if (!enabled || !blanksKey) return;
    const timer = setTimeout(() => {
      channelRef.current?.publish({ slideIndex, step: stepRef.current, ts: Date.now(), blanks: blanksRef.current });
    }, BLANKS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // slideIndex is read at send time on purpose; the index effect above covers slide changes.
  }, [blanksKey, enabled]);

  return status;
}

/** Where the presenter is: slide index and build steps revealed on it (null step = show all). */
export interface SyncedPosition {
  index: number;
  step: number | null;
}

const MAX_SYNCED_STEP = 100;

/**
 * Audience-side hook: subscribes to the realtime channel and returns the
 * latest synced position (slide index, build step) from the presenter.
 *
 * Returns `null` until the first event arrives (audience starts at their own index).
 *
 * @param presentToken  - The deck's presentToken
 * @param enabled       - Set to false to disable sync (offline/fallback mode)
 * @param onBlanks      - Receives validated live values of a `blanks` slide
 */
export function useAudienceSync(
  presentToken: string,
  enabled = true,
  onBlanks?: (slideId: string, values: string[]) => void
): SyncedPosition | null {
  const [synced, setSynced] = React.useState<SyncedPosition | null>(null);
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const onBlanksRef = React.useRef(onBlanks);
  onBlanksRef.current = onBlanks;

  React.useEffect(() => {
    if (!enabled) return;

    const provider = getRealtimeProvider();
    const ch = provider.channel(presentToken);
    channelRef.current = ch;

    ch.subscribe((event) => {
      const step =
        typeof event.step === "number" && Number.isInteger(event.step) && event.step >= 0 && event.step <= MAX_SYNCED_STEP
          ? event.step
          : null;
      // Heartbeats repeat the same position: keep the same object, no re-render.
      setSynced((prev) => (prev && prev.index === event.slideIndex && prev.step === step ? prev : { index: event.slideIndex, step }));
      const blanks = parseBlanksPayload(event.blanks);
      if (blanks) onBlanksRef.current?.(blanks.slideId, blanks.values);
    });

    return () => {
      ch.destroy();
      channelRef.current = null;
    };
  }, [presentToken, enabled]);

  return synced;
}
