export const monitoring = {
  captureException: (error: unknown) => {
    console.error('Monitoring - Exception:', error);
    // Simulate Sentry integration
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error);
      console.log('Sentry.captureException(error)'); // Placeholder
    }
  },
  logEvent: (event: string, data: unknown) => {
    console.log('Monitoring - Event:', event, data);
    // Simulate Sentry integration
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureEvent({ message: event, extra: data });
      console.log('Sentry.captureEvent({ message: event, extra: data })'); // Placeholder
    }
  },
};
