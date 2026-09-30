"use client";

/**
 * Supabase Realtime broadcast implementation of RealtimeProvider.
 *
 * Architecture:
 *  - Presenter joins channel as sender: publishes { slideIndex, ts } at most 10 msg/s
 *  - Audience joins channel as receiver: subscribes and updates local index
 *  - Channel name is keyed to the deck's presentToken (no internal IDs leak)
 *
 * Swappable: replace this file's export with a WebSocket/SSE adapter for VPS.
 */

import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel, RealtimeProvider, SlideEvent } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const EVENT_NAME = "slide_sync";
/** Minimum ms between published events = 10 msg/s max */
const THROTTLE_MS = 100;

class SupabaseRealtimeChannel implements RealtimeChannel {
  private channel: ReturnType<ReturnType<typeof createClient>["channel"]>;
  private lastPublishAt = 0;

  constructor(
    client: ReturnType<typeof createClient>,
    presentToken: string
  ) {
    this.channel = client.channel(`deck:${presentToken}`, {
      config: { broadcast: { self: false } },
    });
    this.channel.subscribe();
  }

  publish(event: SlideEvent): void {
    const now = Date.now();
    if (now - this.lastPublishAt < THROTTLE_MS) return; // throttle
    this.lastPublishAt = now;
    this.channel.send({
      type: "broadcast",
      event: EVENT_NAME,
      payload: event,
    });
  }

  subscribe(handler: (event: SlideEvent) => void): void {
    this.channel.on(
      "broadcast",
      { event: EVENT_NAME },
      ({ payload }: { payload: SlideEvent }) => {
        if (
          typeof payload?.slideIndex === "number" &&
          typeof payload?.ts === "number"
        ) {
          handler(payload);
        }
      }
    );
  }

  destroy(): void {
    this.channel.unsubscribe();
  }
}

class SupabaseRealtimeProvider implements RealtimeProvider {
  private client: ReturnType<typeof createClient>;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  channel(presentToken: string): RealtimeChannel {
    return new SupabaseRealtimeChannel(this.client, presentToken);
  }
}

/** Singleton — one Supabase client per browser session */
let _provider: SupabaseRealtimeProvider | null = null;

export function getRealtimeProvider(): RealtimeProvider {
  if (!_provider) _provider = new SupabaseRealtimeProvider();
  return _provider;
}
