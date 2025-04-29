import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals';
import { analytics } from './analytics';
import { logger } from './logger';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

const ratingThresholds: { [key: string]: [number, number] } = {
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  FID: [100, 300],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
};

const getRating = (name: string, value: number): WebVitalsMetric['rating'] => {
  const thresholds = ratingThresholds[name];
  if (thresholds) {
    return value <= thresholds[0]
      ? 'good'
      : value <= thresholds[1]
        ? 'needs-improvement'
        : 'poor';
  }
  return 'needs-improvement';
};

const reportMetric = (metric: WebVitalsMetric) => {
  // Track in analytics
  analytics.trackPerformance(metric.name, metric.value);

  // Log metric
  logger.debug('Web Vital measured:', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });

  // Report to external service if configured
  if (process.env.NEXT_PUBLIC_VITALS_ENDPOINT) {
    const body = {
      ...metric,
      path: window.location.pathname,
      userAgent: window.navigator.userAgent,
      timestamp: Date.now(),
    };

    fetch(process.env.NEXT_PUBLIC_VITALS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }).catch((error) => {
      logger.error('Failed to report Web Vital:', error);
    });
  }
};

export function initWebVitals() {
  try {
    onCLS((metric) => {
      reportMetric({
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    });

    onFCP((metric) => {
      reportMetric({
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    });

    onFID((metric) => {
      reportMetric({
        name: 'FID',
        value: metric.value,
        rating: getRating('FID', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    });

    onLCP((metric) => {
      reportMetric({
        name: 'LCP',
        value: metric.value,
        rating: getRating('LCP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    });

    onTTFB((metric) => {
      reportMetric({
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    });

    logger.info('Web Vitals monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize Web Vitals:', error);
  }
}
