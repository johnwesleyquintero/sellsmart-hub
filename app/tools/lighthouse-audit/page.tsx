'use client';

import { useEffect, useState } from 'react';
import LighthouseAudit from '@/components/tools/lighthouse-audit/lighthouse-audit';

export default function LighthouseAuditPage() {
  const [metrics, setMetrics] = useState({
    'first-contentful-paint': {
      id: 'first-contentful-paint',
      title: 'First Contentful Paint',
      description: 'First Contentful Paint marks the time at which the first text or image is painted.',
      score: 1,
      numericValue: 462.226,
      numericUnit: 'millisecond',
      displayValue: '0.5 s'
    },
    'largest-contentful-paint': {
      id: 'largest-contentful-paint',
      title: 'Largest Contentful Paint',
      description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
      score: 1,
      numericValue: 557.226,
      numericUnit: 'millisecond',
      displayValue: '0.6 s'
    },
    'speed-index': {
      id: 'speed-index',
      title: 'Speed Index',
      description: 'Speed Index shows how quickly the contents of a page are visibly populated.',
      score: 1,
      numericValue: 735.15,
      numericUnit: 'millisecond',
      displayValue: '0.7 s'
    },
    'is-on-https': {
      id: 'is-on-https',
      title: 'Uses HTTPS',
      description: 'All sites should be protected with HTTPS, even ones that don\'t handle sensitive data.',
      score: 1,
      displayValue: 'Yes'
    },
    'viewport': {
      id: 'viewport',
      title: 'Has viewport meta tag',
      description: 'A viewport meta tag optimizes your app for mobile screen sizes and prevents input delay.',
      score: 1,
      displayValue: 'Yes'
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Website Performance Analysis</h1>
        <p className="text-muted-foreground">
          View detailed performance metrics from your latest Lighthouse audit.
        </p>
      </div>
      
      <LighthouseAudit metrics={metrics} />

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">About Lighthouse Metrics</h2>
        <p className="text-muted-foreground">
          Lighthouse is an open-source tool that helps you improve the quality of your web pages.
          It provides audits for performance, accessibility, progressive web apps, SEO, and more.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-medium">Performance Metrics</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>First Contentful Paint (FCP)</li>
              <li>Largest Contentful Paint (LCP)</li>
              <li>Speed Index</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Best Practices</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>HTTPS Usage</li>
              <li>Viewport Configuration</li>
              <li>Mobile Optimization</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}