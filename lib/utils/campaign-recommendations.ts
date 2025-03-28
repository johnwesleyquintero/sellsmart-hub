import { AmazonMetrics } from "@/lib/api-utils/amazon-metrics";

export function getDefaultRecommendations(metrics: AmazonMetrics): string[] {
  const recommendations: string[] = [];

  if (metrics.acos > 35) {
    recommendations.push("Consider reducing bid amounts");
  }
  if (metrics.ctr < 0.5) {
    recommendations.push("Review keyword relevancy");
  }
  if (metrics.conversionRate < 10) {
    recommendations.push("Optimize product listing");
  }
  if (metrics.profitMargin < 15) {
    recommendations.push("Review pricing strategy");
  }

  // If no specific recommendations, provide a default one
  if (recommendations.length === 0) {
    recommendations.push("Campaign is performing well, continue monitoring");
  }

  return recommendations;
}
