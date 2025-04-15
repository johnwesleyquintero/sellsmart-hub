import { InventoryHealthStatus } from '../amazon-types';
import { INVENTORY_METRICS } from '../config/inventory-config';
export class InventoryUtils {
  static calculateReorderPoint(avgDailySales, leadTime) {
    const safetyStock =
      avgDailySales * leadTime * INVENTORY_METRICS.safetyStockMultiplier;
    return Math.ceil(avgDailySales * leadTime + safetyStock);
  }
  static calculateOptimalOrderQuantity(annualDemand, orderCost, holdingCost) {
    // Economic Order Quantity (EOQ) formula
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  }
  static analyzeInventoryHealth(data) {
    var _a;
    const daysUntilStockout = data.currentInventory / data.averageDailySales;
    const reorderPoint = this.calculateReorderPoint(
      data.averageDailySales,
      (_a = data.leadTime) !== null && _a !== void 0 ? _a : 0,
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
