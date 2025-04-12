// Consolidated Amazon Tools Type Definitions
export * from './algorithms';
export * from './errors';

export interface InventoryData {
  sku: string;
  asin: string;
  price: number;
  fees: {
    referral: number;
    fulfillment: number;
    storage: number;
  };
  unitsSold: number;
  revenue: number;
  acos: number;
}

export interface CompetitorDataRow {
  date: Date;
  competitor: string;
  buyBoxWinner: string;
  listingPrice: number;
  shippingPrice: number;
  isFba: boolean;
  condition: string;
}