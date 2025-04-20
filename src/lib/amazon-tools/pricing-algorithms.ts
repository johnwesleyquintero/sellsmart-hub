import { OptimalPriceParams, ProductScoreParams } from '../amazon-types';

export class PricingAlgorithms {
  /**
   * Calculates optimal price based on market data and product score
   */
  static calculateOptimalPrice(params: OptimalPriceParams): number {
    // Removed unused 'currentPrice' from destructuring
    const { competitorPrices, productScore } = params;

    // Calculate market metrics
    const avgCompetitorPrice =
      competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Calculate price bounds
    const lowerBound = minCompetitorPrice * 0.9; // 10% below minimum competitor
    const upperBound = maxCompetitorPrice * 1.1; // 10% above maximum competitor

    // Base optimal price on market position and product score
    let optimalPrice = avgCompetitorPrice;

    // Adjust price based on product score (0-1 scale)
    if (productScore > 0.8) {
      // High quality products can command premium pricing
      optimalPrice = avgCompetitorPrice * (1 + (productScore - 0.8) * 0.5);
    } else if (productScore < 0.6) {
      // Lower quality products need competitive pricing
      optimalPrice = avgCompetitorPrice * (1 - (0.6 - productScore) * 0.5);
    }

    // Ensure price stays within bounds
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    return Number(optimalPrice.toFixed(2));
  }

  /**
   * Calculates product score based on various metrics
   */
  static calculateProductScore(params: ProductScoreParams): number {
    // Removed unused 'weight' and 'volume' from destructuring
    const {
      conversionRate,
      sessions,
      reviewRating,
      reviewCount,
      priceCompetitiveness,
      inventoryHealth,
    } = params;

    // Normalize metrics to 0-1 scale
    const normalizedConversion = Math.min(conversionRate / 20, 1); // Assume 20% is excellent
    const normalizedSessions = Math.min(sessions / 500, 1); // Assume 500 sessions is excellent
    const normalizedRating = reviewRating / 5;
    const normalizedReviews = Math.min(reviewCount / 100, 1); // Assume 100 reviews is excellent

    // Weight factors (total = 1)
    const weights = {
      conversion: 0.3,
      sessions: 0.15,
      rating: 0.2,
      reviews: 0.15,
      priceComp: 0.1,
      inventory: 0.1,
    };

    // Calculate weighted score
    const score =
      normalizedConversion * weights.conversion +
      normalizedSessions * weights.sessions +
      normalizedRating * weights.rating +
      normalizedReviews * weights.reviews +
      priceCompetitiveness * weights.priceComp +
      inventoryHealth * weights.inventory;

    // Convert to 0-100 scale
    return Number((score * 100).toFixed(2));
  }
}
