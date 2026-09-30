import { PostHog } from 'posthog-node';
import { env } from './env';
import crypto from 'crypto';

let posthogClient: PostHog | null = null;

if (typeof window === "undefined" && env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    flushAt: 1,
    flushInterval: 0
  });
}

function hashId(id: string) {
  return crypto.createHash('sha256').update(id).digest('hex');
}

export const analytics = {
  track: (
    event: 'signup' | 'generation_started' | 'generation_succeeded' | 'generation_failed' | 'deck_presented' | 'audience_joined',
    properties: {
      userId?: string;
      orgId?: string;
      plan?: string;
      deckId?: string;
      error?: string;
      [key: string]: unknown;
    }
  ) => {
    if (!posthogClient) {
      // Fallback for development if no posthog key
      console.log(`[Analytics] Track ${event}:`, properties);
      return;
    }

    const distinctId = properties.userId ? hashId(properties.userId) : properties.orgId ? hashId(properties.orgId) : 'anonymous';
    
    // Hash orgId as required by the task "orgId (hashed)"
    const safeProperties = { ...properties };
    if (safeProperties.orgId) {
      safeProperties.orgId = hashId(safeProperties.orgId);
    }
    if (safeProperties.userId) {
      safeProperties.userId = hashId(safeProperties.userId);
    }
    
    posthogClient.capture({
      distinctId,
      event,
      properties: safeProperties,
    });
  },
  shutdown: async () => {
    if (posthogClient) {
      await posthogClient.shutdown();
    }
  }
};
