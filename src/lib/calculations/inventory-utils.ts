import { InventoryData, InventoryHealthStatus } from '@/types/amazon';
import { INVENTORY_METRICS } from '../config/inventory-config';

export class InventoryUtils {
  static calculateReorderPoint(
    avgDailySales: number,
    leadTime: number,
  ): number {
    const safetyStock =
      avgDailySales * leadTime * INVENTORY_METRICS.safetyStockMultiplier;
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

    const reorderQuantity = this.calculateOptimalOrderQuantity(
      data.averageDailySales * 365,
      INVENTORY_METRICS.defaultOrderCost,
      data.currentInventory * INVENTORY_METRICS.defaultHoldingCostPercentage,
    );

    const status =
      data.currentInventory === 0
        ? InventoryHealthStatus.CRITICAL
        : data.currentInventory < reorderPoint
          ? InventoryHealthStatus.LOW
          : data.currentInventory >
              reorderPoint * INVENTORY_METRICS.maxStockMultiplier
            ? InventoryHealthStatus.EXCESS
            : InventoryHealthStatus.HEALTHY;

    return {
      status,
      daysUntilStockout: Math.floor(daysUntilStockout),
      reorderQuantity: Math.ceil(reorderQuantity),
      reorderPoint: Math.ceil(reorderPoint),
    };
  }
}
