"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LighthouseMetric {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
}

interface LighthouseAuditProps {
  metrics?: {
    "first-contentful-paint": LighthouseMetric;
    "largest-contentful-paint": LighthouseMetric;
    "speed-index": LighthouseMetric;
    "is-on-https": LighthouseMetric;
    viewport: LighthouseMetric;
  };
}

const defaultMetrics = {
  "first-contentful-paint": {
    id: "first-contentful-paint",
    title: "First Contentful Paint",
    description: "Time to first byte of content",
    score: 0.95,
    displayValue: "0.8 s",
    numericValue: 800,
    numericUnit: "milliseconds",
  },
  "largest-contentful-paint": {
    id: "largest-contentful-paint",
    title: "Largest Contentful Paint",
    description: "Time to render largest content element",
    score: 0.82,
    displayValue: "1.2 s",
    numericValue: 1200,
    numericUnit: "milliseconds",
  },
  "speed-index": {
    id: "speed-index",
    title: "Speed Index",
    description: "How quickly content is visually displayed",
    score: 0.89,
    displayValue: "2.1 s",
    numericValue: 2100,
    numericUnit: "milliseconds",
  },
  "is-on-https": {
    id: "is-on-https",
    title: "HTTPS Usage",
    description: "Site is served over HTTPS",
    score: 1,
    displayValue: "Yes",
  },
  viewport: {
    id: "viewport",
    title: "Viewport Configuration",
    description: "Has a proper viewport configuration",
    score: 1,
    displayValue: "Yes",
  },
};

export default function LighthouseAudit({
  metrics = defaultMetrics,
}: LighthouseAuditProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return "bg-gray-300";
    if (score >= 0.9) return "bg-green-500";
    if (score >= 0.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatMetricValue = (metric: LighthouseMetric) => {
    if (metric.displayValue) return metric.displayValue;
    if (metric.numericValue && metric.numericUnit) {
      return `${metric.numericValue} ${metric.numericUnit}`;
    }
    return "N/A";
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Lighthouse Audit Results</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(metrics).map(([id, metric]) => (
          <Card key={id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{metric.title}</h3>
                  <span className="text-sm">
                    {metric.score !== null
                      ? `${Math.round(metric.score * 100)}%`
                      : "N/A"}
                  </span>
                </div>
                <Progress
                  value={metric.score !== null ? metric.score * 100 : 0}
                  className={`h-2 ${getScoreColor(metric.score)}`}
                />
                <p className="text-sm text-muted-foreground">
                  {formatMetricValue(metric)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
