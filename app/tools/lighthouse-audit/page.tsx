"use client";

import LighthouseAudit from "@/components/tools/lighthouse-audit";
import LighthouseInput from "@/components/tools/lighthouse-input";
import { useState } from "react";

export default function LighthouseAuditPage() {
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Website Performance Analysis
        </h1>
        <p className="text-muted-foreground">
          View detailed performance metrics from your latest Lighthouse audit.
        </p>
      </div>

      <LighthouseInput onDataSubmit={setMetrics} />

      {metrics && <LighthouseAudit metrics={metrics} />}

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">About Lighthouse Metrics</h2>
        <p className="text-muted-foreground">
          Lighthouse is an open-source tool that helps you improve the quality
          of your web pages. It provides audits for performance, accessibility,
          progressive web apps, SEO, and more.
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
