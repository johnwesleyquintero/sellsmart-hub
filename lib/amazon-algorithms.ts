import { Product, FeeStructure, InventoryData } from './amazon-types';
import { z } from 'zod';

interface TimeSeriesForecaster {
  series: number[];
  seasonality: 'weekly' | 'monthly' | 'yearly' | 'auto';
  outliers: 'auto' | 'remove' | 'ignore';
  predict(days: number): {
    mean: number;
    stdDev: number;
    values: number[];
  };
}

interface SafetyStockParams {
  demandMean: number;
  demandStdDev: number;
  leadTime: number;
  serviceLevel: number;
}

class InventoryOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryOptimizationError';
  }
}

const calculateSafetyStock = (params: SafetyStockParams): number => {
  const { demandMean, demandStdDev, leadTime, serviceLevel } = params;
  const zScore = 1.645; // 95% service level
  return Math.ceil(zScore * demandStdDev * Math.sqrt(leadTime));
};

export class AmazonAlgorithms {
  static calculateProductScore(product: Product): number {
    const conversionRateWeight = 0.3;
    const sessionWeight = 0.25;
    const reviewWeight = 0.2;
    const pricingWeight = 0.15;
    const inventoryWeight = 0.1;

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

  static calculateInventoryRecommendation(current: InventoryData): {
    reorderPoint: number;
    optimalOrderQty: number;
    forecastedDemand: number[];
    confidenceInterval: [number, number];
  } {
    const inventorySchema = z.object({
      salesLast30Days: z.number().positive(),
      leadTime: z.number().int().nonnegative(),
      currentInventory: z.number().nonnegative(),
      historicalSales: z.array(z.number().nonnegative()).min(30),
    });

    const { success } = inventorySchema.safeParse(current);
    if (!success)
      throw new InventoryOptimizationError('Invalid inventory data');

    const forecaster = new TimeSeriesForecaster({
      series: current.historicalSales,
      seasonality: 'weekly',
      outliers: 'auto',
    });

    const leadTimeDays = current.leadTime;
    const forecast = forecaster.predict(leadTimeDays);

    const safetyStock = calculateSafetyStock({
      demandMean: forecast.mean,
      demandStdDev: forecast.stdDev,
      leadTime: leadTimeDays,
      serviceLevel: 0.95,
    });

    const reorderPoint = Math.ceil(forecast.mean * leadTimeDays) + safetyStock;
    const optimalOrderQty = Math.ceil(
      Math.max(
        reorderPoint - current.currentInventory,
        Math.ceil(forecast.mean * 7),
      ),
    );

    const confidenceInterval: [number, number] = [
      Math.max(0, forecast.mean - 1.96 * forecast.stdDev),
      forecast.mean + 1.96 * forecast.stdDev,
    ];

    return {
      reorderPoint,
      optimalOrderQty,
      forecastedDemand: forecast.values,
      confidenceInterval,
    };
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
