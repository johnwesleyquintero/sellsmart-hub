export interface BaseCsvRow {
  asin: string;
  price: string;
  reviews: string;
  rating: string;
  conversion_rate: string;
  click_through_rate: string;
  niche?: string;
}

export interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
  niche?: string;
}

export type MetricType =
  | 'price'
  | 'reviews'
  | 'rating'
  | 'conversion_rate'
  | 'click_through_rate';

export type CsvValidationResult = {
  validData: ProcessedRow[];
  errors: string[];
};

export interface AmazonToolError extends Error {
  code: 'CSV_VALIDATION' | 'DATA_PROCESSING' | 'API_ERROR';
  context?: Record<string, unknown>;
}
