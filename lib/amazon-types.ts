export interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
}

export interface Product {
  conversionRate: number;
  sessions: number;
  reviewRating: number;
  reviewCount: number;
  priceCompetitiveness: number;
  inventoryHealth: number;
  weight: number;
  volume: number;
  category: ProductCategory;
  lastUpdated: Date;
}

export interface FeeStructure {
  baseFee: number;
  perKgFee: number;
  weightThreshold: number;
  monthlyStorageFee: number;
  referralPercentage: number;
  categoryFees: Record<ProductCategory, number>;
}

export interface InventoryData {
  salesLast30Days: number;
  leadTime: number;
  currentInventory: number;
  averageDailySales: number;
  safetyStock: number;
  status: InventoryHealthStatus;
}

export enum ProductCategory {
  STANDARD = 'standard',
  OVERSIZE = 'oversize',
  HAZMAT = 'hazmat',
  APPAREL = 'apparel'
}

export enum InventoryHealthStatus {
  HEALTHY = 'healthy',
  LOW = 'low',
  EXCESS = 'excess',
  CRITICAL = 'critical'
}

export type MetricType = 'price' | 'reviews' | 'rating' | 'conversion_rate' | 'click_through_rate';

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface CompetitorDataRow extends ProcessedRow {
  name?: string;
}