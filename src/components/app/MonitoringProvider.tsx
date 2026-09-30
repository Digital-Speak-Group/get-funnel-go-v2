"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize PostHog
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
        loaded: (posthog_instance) => {
          if (process.env.NODE_ENV === "development") posthog_instance.debug();
        },
      });
    }

    // Initialize Sentry on client
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
      });
    }
  }, []);

  return <>{children}</>;
}
