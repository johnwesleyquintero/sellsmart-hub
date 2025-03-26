'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
  metrics: {
    'first-contentful-paint': LighthouseMetric;
    'largest-contentful-paint': LighthouseMetric;
    'speed-index': LighthouseMetric;
    'is-on-https': LighthouseMetric;
    viewport: LighthouseMetric;
  };
}

export default function LighthouseAudit({ metrics }: LighthouseAuditProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-300';
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatMetricValue = (metric: LighthouseMetric) => {
    if (metric.displayValue) return metric.displayValue;
    if (metric.numericValue && metric.numericUnit) {
      return `${metric.numericValue} ${metric.numericUnit}`;
    }
    return 'N/A';
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
                    {metric.score !== null ? `${Math.round(metric.score * 100)}%` : 'N/A'}
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