export enum ProductCategory {
  STANDARD = 'STANDARD',
  OVERSIZE = 'OVERSIZE',
  HAZMAT = 'HAZMAT',
  APPAREL = 'APPAREL',
}

export enum InventoryHealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface KeywordData {
  term: string;
  searchVolume: number;
  difficulty: number;
  relevancy: number;
  historicalData?: number[];
}

export interface InventoryData {
  productId: string;
  currentInventory: number;
  averageDailySales: number;
  leadTime: number;
  status: InventoryHealthStatus;
}
