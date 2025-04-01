import { InventoryData, InventoryHealthStatus } from '../amazon-types';

export class InventoryUtils {
  static readonly METRICS = {
    safetyStockMultiplier: 1.5,
    maxStockMultiplier: 3,
    criticalStockDays: 7,
    minProfitMargin: 0.2,
  };

  static calculateReorderPoint(
    avgDailySales: number,
    leadTime: number,
  ): number {
    const safetyStock =
      avgDailySales * leadTime * this.METRICS.safetyStockMultiplier;
    return Math.ceil(avgDailySales * leadTime + safetyStock);
  }

  static calculateOptimalOrderQuantity(
    annualDemand: number,
    orderCost: number,
    holdingCost: number,
  ): number {
    // Economic Order Quantity (EOQ) formula
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  }

  static analyzeInventoryHealth(data: InventoryData): {
    status: InventoryHealthStatus;
    daysUntilStockout: number;
    reorderQuantity: number;
    reorderPoint: number;
  } {
    const daysUntilStockout = data.currentInventory / data.averageDailySales;
    const reorderPoint = this.calculateReorderPoint(
      data.averageDailySales,
      data.leadTime,
    );
    const reorderPoint = safetyStock + leadTimeDemand;
    // Remove unused reorderPoint assignment
    const reorderQuantity = this.calculateOptimalOrderQuantity(
      data.averageDailySales * 365,
      50, // Default order cost
      data.currentInventory * 0.25, // Default holding cost 25% of inventory value
    );

    return {
      status: data.status,
      daysUntilStockout: Math.floor(daysUntilStockout),
      reorderQuantity: Math.ceil(reorderQuantity),
      reorderPoint: reorderPoint,
    };
  }
}
