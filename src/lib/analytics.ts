import { env } from './config';
import { logger } from './logger';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

interface NetworkInformation {
  effectiveType: string;
  downlink: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 20;
  private isProcessing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Set up periodic flush
      setInterval(() => this.flush(), this.flushInterval);

      // Flush before page unload
      window.addEventListener('beforeunload', () => this.flush());

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        this.track('visibility_change', {
          state: document.visibilityState,
          timestamp: performance.now(),
        });
      });
    }
  }

  public track(eventName: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.queue.push(event);
    logger.debug('Analytics event queued:', event);

    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const events = [...this.queue];
    this.queue = [];

    try {
      if (env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        const response = await fetch(env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        });

        if (!response.ok) {
          throw new Error(`Analytics request failed: ${response.statusText}`);
        }

        logger.debug('Analytics events sent successfully:', {
          count: events.length,
        });
      }
    } catch (error) {
      logger.error('Failed to send analytics events:', error);
      // Put events back in queue
      this.queue = [...events, ...this.queue].slice(0, this.maxQueueSize);
    } finally {
      this.isProcessing = false;
    }
  }

  // Utility methods for common events
  public trackPageView(path: string) {
    this.track('page_view', {
      path,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
    });
  }

  public trackError(error: Error, context?: Record<string, unknown>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }

  public trackPerformance(metric: string, value: number) {
    this.track('performance', {
      metric,
      value,
      connection: navigator.connection
        ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
          }
        : undefined,
    });
  }

  public trackInteraction(
    element: string,
    action: 'click' | 'hover' | 'focus' | 'blur',
    properties?: Record<string, unknown>,
  ) {
    this.track('interaction', {
      element,
      action,
      ...properties,
    });
  }
}

export const analytics = new Analytics();
