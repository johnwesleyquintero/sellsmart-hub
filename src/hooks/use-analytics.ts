'use client';

import { analytics } from '@/lib/analytics';
import { useCallback, useEffect } from 'react';

export function useAnalytics() {
  useEffect(() => {
    analytics.trackPageView(window.location.pathname);
  }, []);

  // Track user interactions
  const trackInteraction = useCallback(
    (
      element: string,
      action: 'click' | 'hover' | 'focus' | 'blur',
      properties?: Record<string, unknown>,
    ) => {
      analytics.trackInteraction(element, action, properties);
    },
    [],
  );

  // Track custom events
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      analytics.track(eventName, properties);
    },
    [],
  );

  return {
    trackInteraction,
    trackEvent,
  };
}
