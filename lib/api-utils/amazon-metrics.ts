export interface AmazonMetrics {
  acos: number;
  roas: number;
  ctr: number;
  conversionRate: number;
  profitMargin: number;
  seasonality: number;
  competitiveIndex: number;
}

export function calculateAmazonMetrics(data: {
  adSpend: number;
  sales: number;
  impressions: number;
  clicks: number;
  cost: number;
  category?: string;
}): AmazonMetrics {
  const acos = (data.adSpend / data.sales) * 100;
  const roas = data.sales / data.adSpend;
  const ctr = (data.clicks / data.impressions) * 100;
  const conversionRate = (data.sales / data.clicks) * 100;
  const profitMargin =
    ((data.sales - data.cost - data.adSpend) / data.sales) * 100;

  // Calculate seasonality based on category and current month
  const seasonality = calculateSeasonalityScore(data.category);

  // Calculate competitive index based on industry averages
  const competitiveIndex = calculateCompetitiveIndex({
    acos,
    ctr,
    conversionRate,
    category: data.category,
  });

  return {
    acos,
    roas,
    ctr,
    conversionRate,
    profitMargin,
    seasonality,
    competitiveIndex,
  };
}

function calculateSeasonalityScore(category?: string): number {
  const month = new Date().getMonth();
  const seasonalFactors: Record<string, number[]> = {
    Electronics: [1.2, 0.8, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.8, 2.0],
    "Home & Kitchen": [
      1.1, 0.9, 1.0, 1.2, 1.3, 1.2, 1.0, 1.1, 1.2, 1.3, 1.5, 1.6,
    ],
    // Add more categories...
  };

  if (!category || !seasonalFactors[category]) {
    return seasonalFactors["Electronics"][month]; // Default to electronics
  }

  return seasonalFactors[category][month];
}

function calculateCompetitiveIndex(metrics: {
  acos: number;
  ctr: number;
  conversionRate: number;
  category?: string;
}): number {
  const benchmarks: Record<
    string,
    { acos: number; ctr: number; conversionRate: number }
  > = {
    Electronics: { acos: 30, ctr: 0.4, conversionRate: 12 },
    "Home & Kitchen": { acos: 25, ctr: 0.5, conversionRate: 15 },
    // Add more categories...
  };

  const benchmark = benchmarks[metrics.category || "Electronics"];

  // Calculate how metrics compare to benchmarks
  const acosScore = benchmark.acos / metrics.acos;
  const ctrScore = metrics.ctr / benchmark.ctr;
  const conversionScore = metrics.conversionRate / benchmark.conversionRate;

  return ((acosScore + ctrScore + conversionScore) / 3) * 100;
}
