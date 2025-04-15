import { ProductCategory } from '../amazon-types';

export type MetricKey = 'acos' | 'roas' | 'ctr' | 'cpc';

export interface ProductData {
  productId: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  storageDuration: number;
  unitsSold: number;
  referralFeePercentage: number;
  product: string;
  cost: number;
  price: number;
  fees: number;
  category: ProductCategory;
  profit?: number;
  roi?: number;
  margin?: number;
}

export interface KeywordData {
  product: string;
  originalKeywords: string[];
  cleanedKeywords: string[];
  duplicatesRemoved: number;
  keywords: string[];
}

export interface CsvRow {
  [key: string]: string;
}

export interface UploaderProps {
  onUpload: (data: string | number[]) => Promise<void>;
}

export interface SampleCsvButtonProps {
  toolName: string;
}

export interface TooltipProps {
  wrapperStyle?: {
    backgroundColor: string;
    border: string;
    borderRadius: number;
  };
  formatter?: (value: string | number, name: string) => (string | number)[];
}
