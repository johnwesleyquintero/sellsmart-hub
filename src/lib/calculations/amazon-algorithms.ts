import { InventoryHealthStatus, ProductCategory } from '@/lib/amazon-types';
import { INVENTORY_METRICS } from '../config/inventory-config';

export class AmazonAlgorithms {
  static readonly FEE_STRUCTURE = {
    baseFee: 2.92,
    perKgFee: 0.3,
    weightThreshold: 0.5,
    monthlyStorageFee: 2.4,
    referralPercentage: 0.15,
    categoryFees: {
      [ProductCategory.STANDARD]: 1.0,
      [ProductCategory.OVERSIZE]: 2.0,
      [ProductCategory.HAZMAT]: 3.0,
      [ProductCategory.APPAREL]: 1.5,
    },
  };

  static calculateFBAFees(weight: number, category: ProductCategory): number {
    const baseFee = this.FEE_STRUCTURE.baseFee;
    const weightFee =
      weight > this.FEE_STRUCTURE.weightThreshold
        ? (weight - this.FEE_STRUCTURE.weightThreshold) *
          this.FEE_STRUCTURE.perKgFee
        : 0;
    const categoryFee = this.FEE_STRUCTURE.categoryFees[category];

    return baseFee + weightFee + categoryFee;
  }

  static calculateProfitMargin(
    cost: number,
    price: number,
    fees: number,
  ): number {
    const revenue = price;
    const totalCost = cost + fees;
    return ((revenue - totalCost) / revenue) * 100;
  }

  static calculateOptimalPrice(
    productionCost: number,
    competitorPrice: number,
    demandCurve: number[],
    historicalSales: number[],
    marketPosition: number,
    elasticity: number
  ): number {
    const avgCompetitorPrice =
      competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const priceAdjustment = productScore * 0.2; // 20% max adjustment based on score
    return avgCompetitorPrice * (1 + priceAdjustment);
  }

  static calculateInventoryHealth(
    currentStock: number,
    avgDailySales: number,
    leadTime: number,
  ): InventoryHealthStatus {
    const safetyStock =
      avgDailySales * leadTime * INVENTORY_METRICS.safetyStockMultiplier;

    if (currentStock === 0) return InventoryHealthStatus.CRITICAL;
    if (currentStock < safetyStock) return InventoryHealthStatus.LOW;
    if (currentStock > safetyStock * INVENTORY_METRICS.maxStockMultiplier)
      return InventoryHealthStatus.EXCESS;
    return InventoryHealthStatus.HEALTHY;
  }
}
