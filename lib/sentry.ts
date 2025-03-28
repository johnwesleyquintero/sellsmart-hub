import * as Sentry from "@sentry/nextjs";

export const initSentry = () => {
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
    });
  }
};

export const captureException = (
  error: Error,
  context?: Record<string, any>,
) => {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error("Development Error:", error, context);
  }
};
