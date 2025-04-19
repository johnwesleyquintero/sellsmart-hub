import { OptimalPriceParams, ProductScoreParams } from '../amazon-types';
export class AmazonAlgorithms {
  /**
   * Calculates product quality score based on market data
   * @param params Product score parameters
   * @returns Product quality score (0-100)
   */
  static calculateProductScore(params: ProductScoreParams): number {
    const {
      conversionRate,
      sessions,
      reviewRating,
      reviewCount,
      priceCompetitiveness,
      inventoryHealth
    } = params;

    // Normalize metrics to 0-1 scale
    const normalizedConversion = Math.min(conversionRate / 20, 1);
    const normalizedSessions = Math.min(sessions / 500, 1);
    const normalizedRating = reviewRating / 5;
    const normalizedReviews = Math.min(reviewCount / 100, 1);

    // Weight factors
    const weights = {
      conversion: 0.3,
      sessions: 0.15,
      rating: 0.2,
      reviews: 0.15,
      priceComp: 0.1,
      inventory: 0.1
    };

    // Calculate weighted score
    const score =
      normalizedConversion * weights.conversion +
      normalizedSessions * weights.sessions +
      normalizedRating * weights.rating +
      normalizedReviews * weights.reviews +
      priceCompetitiveness * weights.priceComp +
      inventoryHealth * weights.inventory;

    return Number((score * 100).toFixed(2));
  }

  /**
   * Determines optimal pricing based on market analysis
   * @param params Optimal price calculation parameters
   * @returns Calculated optimal price
   */
  static calculateOptimalPrice(params: OptimalPriceParams): number {
    // Removed unused 'currentPrice' from destructuring
    const { competitorPrices, productScore } = params;

    // Calculate market metrics
    const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Calculate price bounds
    const lowerBound = minCompetitorPrice * 0.9;
    const upperBound = maxCompetitorPrice * 1.1;

    // Base optimal price on market position and product score
    let optimalPrice = avgCompetitorPrice;

    // Adjust price based on product score (assuming 0-1 scale based on logic, though calculateProductScore returns 0-100)
    // Consider scaling productScore if it's passed in as 0-100: const scaledScore = productScore / 100;
    if (productScore > 0.8) {
      optimalPrice = avgCompetitorPrice * (1 + (productScore - 0.8) * 0.5);
    } else if (productScore < 0.6) {
      optimalPrice = avgCompetitorPrice * (1 - (0.6 - productScore) * 0.5);
    }

    // Ensure price stays within bounds
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    return Number(optimalPrice.toFixed(2));
  }
}
