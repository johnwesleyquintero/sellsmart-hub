import { CompetitorMetrics } from './market-analysis';

export interface PricingStrategy {
  strategy: 'premium' | 'competitive' | 'economy';
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
}

export interface MarketPosition {
  segment: 'budget' | 'midrange' | 'premium';
  competitiveAdvantage: string[];
  threats: string[];
  opportunities: string[];
}

export class CompetitorUtils {
  static analyzePricing({
    competitorPrices,
    productCost,
    targetMargin,
    marketTrend
  }: {
    competitorPrices: number[];
    productCost?: number;
    targetMargin?: number;
    marketTrend?: 'rising' | 'stable' | 'declining';
  }): PricingStrategy {
    // Remove outliers
    const sortedPrices = [...competitorPrices].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedPrices.length * 0.25);
    const q3Index = Math.floor(sortedPrices.length * 0.75);
    const validPrices = sortedPrices.slice(q1Index, q3Index + 1);

    const avgPrice = validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    // Determine pricing strategy based on market conditions
    let strategy: PricingStrategy['strategy'] = 'competitive';
    let priceMultiplier = 1;

    if (marketTrend === 'rising' && targetMargin && targetMargin > 0.3) {
      strategy = 'premium';
      priceMultiplier = 1.1;
    } else if (marketTrend === 'declining' || (targetMargin && targetMargin < 0.2)) {
      strategy = 'economy';
      priceMultiplier = 0.9;
    }

    // Calculate suggested price
    const suggestedPrice = avgPrice * priceMultiplier;

    // Calculate confidence based on price spread and sample size
    const priceSpread = maxPrice - minPrice;
    const confidence = Math.min(
      ((validPrices.length / competitorPrices.length) * 100) *
        (1 - priceSpread / maxPrice),
      100
    );

    return {
      strategy,
      suggestedPrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      confidence
    };
  }

  static analyzeMarketPosition(metrics: CompetitorMetrics[]): MarketPosition {
    const avgPrice = metrics.reduce((sum, m) => sum + m.price, 0) / metrics.length;
    const avgRating = metrics.reduce((sum, m) => sum + m.rating, 0) / metrics.length;
    const avgReviews = metrics.reduce((sum, m) => sum + m.reviews, 0) / metrics.length;

    // Determine market segment
    const segment = avgPrice > 100 ? 'premium' : avgPrice > 50 ? 'midrange' : 'budget';

    // Analyze competitive advantages
    const competitiveAdvantage = [];
    if (avgRating > 4.5) competitiveAdvantage.push('High product quality');
    if (avgReviews > 1000) competitiveAdvantage.push('Strong market presence');
    if (metrics.length < 10) competitiveAdvantage.push('Limited competition');

    // Identify threats
    const threats = [];
    if (avgPrice < 20) threats.push('Price war risk');
    if (metrics.length > 50) threats.push('Saturated market');
    if (avgRating < 4.0) threats.push('Quality concerns');

    // Identify opportunities
    const opportunities = [];
    if (avgReviews < 500) opportunities.push('Market growth potential');
    if (avgRating < 4.5) opportunities.push('Quality differentiation');
    if (segment === 'premium') opportunities.push('Brand development');

    return {
      segment,
      competitiveAdvantage,
      threats,
      opportunities
    };
  }
}