"use client";

import * as React from "react";
import { getRealtimeProvider } from "@/lib/realtime/supabase";
import type { RealtimeChannel } from "@/lib/realtime/types";

/**
 * Presenter-side hook: publishes the current slide index to the realtime channel.
 * Call this in PresenterShell with the presentToken and the current index.
 *
 * @param presentToken  - The deck's presentToken (used as channel key)
 * @param slideIndex    - The current slide index to publish
 * @param enabled       - Set to false to disable sync (e.g. during offline editing)
 */
export function usePresenterSync(
  presentToken: string,
  slideIndex: number,
  enabled = true
): void {
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    const provider = getRealtimeProvider();
    const ch = provider.channel(presentToken);
    channelRef.current = ch;
    return () => {
      ch.destroy();
      channelRef.current = null;
    };
  }, [presentToken, enabled]);

  // Publish on every index change
  React.useEffect(() => {
    if (!enabled || !channelRef.current) return;
    channelRef.current.publish({ slideIndex, ts: Date.now() });
  }, [slideIndex, enabled]);
}

/**
 * Audience-side hook: subscribes to the realtime channel and returns the
 * latest synced slide index from the presenter.
 *
 * Returns `null` until the first event arrives (audience starts at their own index).
 *
 * @param presentToken  - The deck's presentToken
 * @param enabled       - Set to false to disable sync (offline/fallback mode)
 */
export function useAudienceSync(
  presentToken: string,
  enabled = true
): number | null {
  const [syncedIndex, setSyncedIndex] = React.useState<number | null>(null);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const provider = getRealtimeProvider();
    const ch = provider.channel(presentToken);
    channelRef.current = ch;

    ch.subscribe((event) => {
      setSyncedIndex(event.slideIndex);
    });

    return () => {
      ch.destroy();
      channelRef.current = null;
    };
  }, [presentToken, enabled]);

  return syncedIndex;
}
