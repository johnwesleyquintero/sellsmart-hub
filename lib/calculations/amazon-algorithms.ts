import { ProductCategory, InventoryHealthStatus } from '../amazon-types';

export class AmazonAlgorithms {
    static readonly FEE_STRUCTURE = {
        baseFee: 2.92,
        perKgFee: 0.30,
        weightThreshold: 0.5,
        monthlyStorageFee: 2.40,
        referralPercentage: 0.15,
        categoryFees: {
            [ProductCategory.STANDARD]: 1.00,
            [ProductCategory.OVERSIZE]: 2.00,
            [ProductCategory.HAZMAT]: 3.00,
            [ProductCategory.APPAREL]: 1.50,
        }
    };

    static calculateFBAFees(weight: number, category: ProductCategory): number {
        const baseFee = this.FEE_STRUCTURE.baseFee;
        const weightFee = weight > this.FEE_STRUCTURE.weightThreshold
            ? (weight - this.FEE_STRUCTURE.weightThreshold) * this.FEE_STRUCTURE.perKgFee
            : 0;
        const categoryFee = this.FEE_STRUCTURE.categoryFees[category];

        return baseFee + weightFee + categoryFee;
    }

    static calculateProfitMargin(cost: number, price: number, fees: number): number {
        const revenue = price;
        const totalCost = cost + fees;
        return ((revenue - totalCost) / revenue) * 100;
    }

    static calculateOptimalPrice(
        currentPrice: number,
        competitorPrices: number[],
        productScore: number
    ): number {
        const avgCompetitorPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
        const priceAdjustment = productScore * 0.2; // 20% max adjustment based on score
        return avgCompetitorPrice * (1 + priceAdjustment);
    }

    static calculateInventoryHealth(
        currentStock: number,
        avgDailySales: number,
        leadTime: number
    ): InventoryHealthStatus {
        const daysOfStock = currentStock / avgDailySales;
        const safetyStock = avgDailySales * leadTime * 1.5; // 50% buffer

        if (currentStock === 0) return InventoryHealthStatus.CRITICAL;
        if (currentStock < safetyStock) return InventoryHealthStatus.LOW;
        if (currentStock > safetyStock * 3) return InventoryHealthStatus.EXCESS;
        return InventoryHealthStatus.HEALTHY;
    }
}
