export interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
}

export type MetricType = 'price' | 'reviews' | 'rating' | 'conversion_rate' | 'click_through_rate';

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface CompetitorDataRow extends ProcessedRow {
  name?: string;
}