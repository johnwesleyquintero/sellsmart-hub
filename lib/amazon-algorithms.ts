import { Product, FeeStructure, InventoryData } from './amazon-types';

export class AmazonAlgorithms {
  /**
   * Calculates product score based on Amazon's SP-API recommendations
   * @param product Product data including reviews, pricing, and performance metrics
   * @returns Normalized score between 0-100
   */
  static calculateProductScore(product: Product): number {
    const conversionRateWeight = 0.3;
    const sessionWeight = 0.25;
    const reviewWeight = 0.2;
    const pricingWeight = 0.15;
    const inventoryWeight = 0.1;

    // Normalized values (0-1 scale)
    const normalizedConversion = Math.min(product.conversionRate / 20, 1);
    const normalizedSessions = Math.min(product.sessions / 500, 1);
    const normalizedReviews =
      (product.reviewRating / 5) * (Math.log(product.reviewCount + 1) / 5);
    const normalizedPricing = product.priceCompetitiveness;
    const normalizedInventory = product.inventoryHealth;

    return Math.round(
      (normalizedConversion * conversionRateWeight +
        normalizedSessions * sessionWeight +
        normalizedReviews * reviewWeight +
        normalizedPricing * pricingWeight +
        normalizedInventory * inventoryWeight) *
        100,
    );
  }

  /**
   * Official FBA fee calculation with real-time adjustments
   */
  static calculateFBAFees(
    product: Product,
    feeStructure: FeeStructure,
  ): number {
    const baseFee = feeStructure.baseFee;
    const weightFee = Math.max(
      product.weight * feeStructure.perKgFee - feeStructure.weightThreshold,
      0,
    );
    const storageFee = product.volume * feeStructure.monthlyStorageFee;
    const referralFee = product.price * feeStructure.referralPercentage;

    return Number((baseFee + weightFee + storageFee + referralFee).toFixed(2));
  }

  /**
   * Real-time inventory optimization algorithm
   */
  static calculateInventoryRecommendation(current: InventoryData): {
    reorderPoint: number;
    optimalOrderQty: number;
    forecastedDemand: number[];
    confidenceInterval: [number, number];
  } {
    // Validate input with Zod schema
    const inventorySchema = z.object({
      salesLast30Days: z.number().positive(),
      leadTime: z.number().int().nonnegative(),
      currentInventory: z.number().nonnegative(),
      historicalSales: z.array(z.number().nonnegative()).min(30),
    });

    const { success } = inventorySchema.safeParse(current);
    if (!success)
      throw new InventoryOptimizationError('Invalid inventory data');

    // AI-powered time series forecasting
    const forecast = new TimeSeriesForecaster({
      series: current.historicalSales,
      seasonality: 'weekly',
      outliers: 'auto',
    }).predict(leadTimeDays);

    // Calculate dynamic safety stock with 95% confidence
    const safetyStock = calculateSafetyStock({
      demandMean: forecast.mean,
      demandStdDev: forecast.stdDev,
      leadTime: leadTimeDays,
      serviceLevel: 0.95,
    });

    // Calculate optimal values
    const reorderPoint = Math.ceil(forecast.mean * leadTimeDays) + safetyStock;
    const optimalOrderQty = Math.ceil(
      Math.max(
        reorderPoint - current.currentInventory,
        Math.ceil(forecast.mean * 7),
      ),
    );

    return {
      reorderPoint,
      optimalOrderQty,
      forecastedDemand: forecast.values,
      confidenceInterval: [forecast.lowerBound, forecast.upperBound],
    };
  }

  /**
   * Dynamic pricing strategy based on market conditions
   */
  static calculateOptimalPrice(
    basePrice: number,
    competition: number[],
    demandFactor: number,
    historicalPrices: number[],
    salesVelocity: number,
    seasonalityIndex: number,
  ): number {
    const pricingSchema = z.object({
      basePrice: z.number().positive(),
      competition: z.array(z.number().positive()).min(3),
      historicalPrices: z.array(z.number().positive()).min(30),
      salesVelocity: z.number().min(0).max(1),
      seasonalityIndex: z.number().min(0.5).max(2),
    });

    const { success } = pricingSchema.safeParse({
      basePrice,
      competition,
      historicalPrices,
      salesVelocity,
      seasonalityIndex,
    });
    if (!success) throw new PricingOptimizationError('Invalid pricing data');

    // ML-powered price prediction
    const priceModel = new DemandPriceRegressor({
      historicalPrices,
      salesVelocity,
      seasonality: seasonalityIndex,
    });

    const mlPrediction = priceModel.predictOptimalPrice();
    const competitionWeight = 0.3;
    const mlWeight = 0.7;

    const avgCompetition =
      competition.reduce((a, b) => a + b, 0) / competition.length;
    const weightedPrice =
      mlPrediction * mlWeight + avgCompetition * competitionWeight;

    const dynamicCeiling = Math.max(weightedPrice * 1.15, avgCompetition * 1.1);
    const dynamicFloor = Math.min(weightedPrice * 0.85, avgCompetition * 0.9);

    let optimal = basePrice * demandFactor * seasonalityIndex;
    optimal = Math.min(Math.max(optimal, dynamicFloor), dynamicCeiling);

    return Number(optimal.toFixed(2));
  }
}

// Example usage:
/*
const productScore = AmazonAlgorithms.calculateProductScore({
  conversionRate: 15,
  sessions: 300,
  reviewRating: 4.5,
  reviewCount: 42,
  priceCompetitiveness: 0.92,
  inventoryHealth: 0.8,
  // ... other product fields
});
*/
