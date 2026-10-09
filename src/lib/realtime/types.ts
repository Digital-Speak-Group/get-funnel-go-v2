/**
 * Realtime provider interface — vendor-free.
 * The Supabase implementation can be swapped for a WebSocket/SSE implementation
 * on a VPS deployment without touching any component code.
 */

export interface SlideEvent {
  /** Current slide index (0-based) */
  slideIndex: number;
  /** Server timestamp (ms) for drift detection */
  ts: number;
  /**
   * Values typed by the presenter into the current `blanks` slide (Task 60). Untrusted on
   * the receiving side: anyone holding the token can publish, so audiences validate it.
   */
  blanks?: { slideId: string; values: string[] };
}

export interface RealtimeChannel {
  /** Publish the current slide to all audience subscribers */
  publish(event: SlideEvent): void;
  /** Subscribe to slide events from the presenter */
  subscribe(handler: (event: SlideEvent) => void): void;
  /** Clean up the channel */
  destroy(): void;
}

export interface RealtimeProvider {
  /**
   * Open a broadcast channel keyed by deck present token.
   * Presenter and audience join the same channel; presenter writes, audience reads.
   */
  channel(presentToken: string): RealtimeChannel;
}
