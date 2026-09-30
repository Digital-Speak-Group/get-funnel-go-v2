import * as Sentry from '@sentry/nextjs';
import { env } from './env';

export const monitoring = {
  init: () => {
    if (env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
      });
    }
  },
  captureException: (error: unknown, context?: Record<string, unknown>) => {
    if (env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, { extra: context });
    } else {
      console.error("[Monitoring] Exception:", error, context);
    }
  },
  captureMessage: (message: string, context?: Record<string, unknown>) => {
    if (env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(message, { extra: context });
    } else {
      console.log("[Monitoring] Message:", message, context);
    }
  }
};
