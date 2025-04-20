'use client';

import { AmazonAlgorithms } from '@/lib/amazon-tools/amazon-algorithms';

import { ProductCategory } from '@/lib/amazon-types';
import type React from 'react';
import { useState } from 'react';

// Correct the import paths
import CsvUploader from './CsvUploader';

interface ManualProduct {
  product: string;
  cost: number;
  price: number;
  fees: number;
}

export default function ProfitMarginCalculator() {
  interface ProductData {
    product: string;
    cost: number;
    fees: number;
    sessions?: number;
    reviewRating?: number;
    reviewCount?: number;
    priceCompetitiveness?: number;
    inventoryHealth?: number;
    weight?: number;
    volume?: number;
    competitorPrices?: number[];
    reviews?: number | null;
    salesRank?: number;
    price?: number;
  }

  interface CsvRow {
    id: string;
    impressions: number;
    clicks: number;
  }

  // Removed duplicate function export
  // Existing implementation kept at line 37

  const [results, setResults] = useState<ProductData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<ProductData[]>([]);
  const [manualProduct, setManualProduct] = useState<ManualProduct>({
    product: '',
    cost: 0,
    price: 0,
    fees: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (data: CsvRow[]) => {
    setError(null);
    setIsLoading(true);
    try {
      if (!data || data.length === 0) {
        throw new Error('No valid data found in CSV');
      }

      const productData = data.map((row) => ({
        product: row.id,
        cost: 0,
        price: 0,
        fees: 0,
        conversionRate: row.impressions,
        sessions: row.clicks,
      }));
      setCsvData(productData);
      console.log('csvData', csvData);
      calculateResults(productData);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Error processing CSV file: ${err.message}`);
      } else {
        setError(`An unknown error occurred: ${err}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateResults = (data: ProductData[]) => {
    if (!data || data.length === 0) {
      setError('No valid data to calculate');
      return;
    }

    const calculated = data.map((item: ProductData) => {
      const productScore = AmazonAlgorithms.calculateProductScore({
        reviews: item.reviews || null,
        rating: item.reviewRating || 4.5,
        salesRank: item.salesRank || 1000,
        price: item.price || 25,
        category: ProductCategory.STANDARD,
      });

      const adjustedPrice = AmazonAlgorithms.calculateOptimalPrice({
        currentPrice: item.price || 0,
        competitorPrices: item.competitorPrices || [
          (item.price || 0) * 0.9,
          (item.price || 0) * 1.1,
        ],
        productScore: productScore / 100,
      });

      const profit = adjustedPrice - item.cost - item.fees;
      const margin = (profit / (item.price || 1)) * 100;
      const roi = (profit / item.cost) * 100;
      return {
        ...item,
        profit,
        margin: parseFloat(margin.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
      };
    });

    if (calculated.length === 0) {
      setError('Failed to calculate results');
      return;
    }

    setResults(calculated);
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!manualProduct.product.trim()) {
      setError('Please enter a product name');
      return;
    }

    const cost = Number(manualProduct.cost);
    const price = Number(manualProduct.price);
    const fees = Number(manualProduct.fees);

    if (isNaN(cost) || cost <= 0) {
      setError('Product cost must be a valid positive number');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setError('Selling price must be a valid positive number');
      return;
    }

    if (isNaN(fees) || fees < 0) {
      setError('Fees must be a valid non-negative number');
      return;
    }

    if (price <= cost + fees) {
      setError(
        'Selling price must be greater than the sum of cost and fees for a profitable margin',
      );
      return;
    }

    const newProduct = {
      product: manualProduct.product.trim(),
      cost,
      price,
      fees,
    };

    calculateResults([newProduct]);
    setManualProduct({ product: '', cost: 0, price: 0, fees: 0 });
  };

  console.log('ProfitMarginCalculator: Before return statement');
  console.log('ProfitMarginCalculator: Component end');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <CsvUploader
        onUploadSuccess={handleFileUpload}
        isLoading={isLoading}
        onClear={() => {}}
        hasData={false}
      />

      <form onSubmit={handleManualSubmit} className="space-y-4 mb-6">
        {/* Form fields */}
      </form>

      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Calculation Results</h2>
          {/* Results table */}
        </div>
      )}

      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  );
}
