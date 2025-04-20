import { OptimalPriceParams } from '../amazon-types';
export class AmazonAlgorithms {
  /**
   * Calculates Advertising Cost of Sales (ACoS)
   * @param adSpend Total advertising spend
   * @param sales Total sales revenue
   * @returns ACoS percentage (0-100)
   */
  static calculateACoS(adSpend: number, sales: number): number {
    if (sales <= 0 || adSpend < 0) {
      throw new Error(
        'Invalid input: sales must be positive and adSpend non-negative',
      );
    }
    return Number(((adSpend / sales) * 100).toFixed(2));
  }

  /**
   * Calculates product quality score based on market data
   * @param params Product score parameters
   * @returns Product quality score (0-100)
   */
  static calculateProductScore(productData: {
    reviews: number | null;
    rating: number;
    salesRank: number;
    price: number;
    category: string;
  }): number {
    const { rating } = productData;

    // Normalize metrics to 0-1 scale
    const normalizedConversion = 0.5; // Placeholder value
    const normalizedSessions = 0.5; // Placeholder value
    const normalizedRating = rating / 5;

    // Weight factors
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
      normalizedRating * weights.rating;

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
    if (competitorPrices.length === 0) {
      return 0;
    }
    const avgCompetitorPrice =
      competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const minCompetitorPrice = Math.min(...competitorPrices);
    const maxCompetitorPrice = Math.max(...competitorPrices);

    // Calculate price bounds
    const lowerBound = minCompetitorPrice * 0.9;
    const upperBound = maxCompetitorPrice * 1.1;

    // Base optimal price on market position and product score
    let optimalPrice = avgCompetitorPrice;

    // Adjust price based on product score (assuming 0-1 scale based on logic, though calculateProductScore returns 0-100)
    const scaledScore = productScore / 100; // Scale the product score
    if (scaledScore > 0.8) {
      optimalPrice = avgCompetitorPrice * (1 + (scaledScore - 0.8) * 0.5);
    } else if (scaledScore < 0.6) {
      optimalPrice = avgCompetitorPrice * (1 - (0.6 - scaledScore) * 0.5);
    }

    // Ensure price stays within bounds
    optimalPrice = Math.max(lowerBound, Math.min(upperBound, optimalPrice));

    return Number(optimalPrice.toFixed(2));
  }
}
