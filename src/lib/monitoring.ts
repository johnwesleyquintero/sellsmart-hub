import { logger } from './logger';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  amazonApiRequestDuration: number; // Amazon API request duration
}

interface CacheMetrics {
  cacheHit: number;
  cacheMiss: number;
  cacheRetrievalTime: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private cacheHitCount: number = 0;
  private cacheMissCount: number = 0;
  private totalRetrievalTime: number = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    // Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        this.reportMetric('lcp', lcp);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fid = (entry as PerformanceEventTiming).processingStart
            ? (entry as PerformanceEventTiming).processingStart -
              entry.startTime
            : 0;
          this.reportMetric('fid', fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsScore = 0;
        list.getEntries().forEach((entry) => {
          entry as unknown as LayoutShiftEntry;
          if (!(entry as LayoutShiftEntry).hadRecentInput) {
            clsScore += (entry as LayoutShiftEntry).value;
          }
        });
        this.reportMetric('cls', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Navigation Timing
      const navigationObserver = new PerformanceObserver((list) => {
        const navigation = list.getEntries()[0] as PerformanceNavigationTiming;
        this.reportMetric(
          'ttfb',
          navigation.responseStart - navigation.requestStart,
        );
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  public reportMetric(
    name: keyof PerformanceMetrics | keyof CacheMetrics,
    value: number,
  ): void {
    logger.info(`Performance metric: ${name}`, {
      metric: name,
      value,
      url: window.location.pathname,
    });

    // Send to analytics if available
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          value,
          url: window.location.pathname,
          timestamp: Date.now(),
        }),
      }).catch((error) => {
        logger.error('Failed to send metric:', { error });
      });
    }
  }

  public trackError(error: Error, context?: Record<string, unknown>): void {
    logger.error('Application error:', {
      error,
      context,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    });
  }

  public trackNavigation(path: string): void {
    const navigationStart = performance.now();
    logger.info('Navigation started:', {
      path,
      timestamp: navigationStart,
    });
  }

  public incrementCacheHit(): void {
    this.cacheHitCount++;
    this.reportMetric('cacheHit', this.cacheHitCount);
  }

  public incrementCacheMiss(): void {
    this.cacheMissCount++;
    this.reportMetric('cacheMiss', this.cacheMissCount);
  }

  public recordRetrievalTime(time: number): void {
    this.totalRetrievalTime += time;
    this.reportMetric('cacheRetrievalTime', time);
  }
}

export const monitor = PerformanceMonitor.getInstance();
