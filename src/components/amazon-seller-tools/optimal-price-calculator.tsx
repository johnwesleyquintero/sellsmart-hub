'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AmazonAlgorithms } from '@/lib/amazon-tools/amazon-algorithms';
import { ProductCategory } from '@/lib/amazon-types';
import { useState } from 'react';

interface ProductInputs {
  cost: number;
  currentPrice: number;
  competitorPrices: string; // Comma-separated prices
  conversionRate: number;
  sessions: number;
  reviewRating: number;
  reviewCount: number;
  priceCompetitiveness: number;
  inventoryHealth: number;
  weight: number;
  volume: number;
}

export default function OptimalPriceCalculator() {
  const [inputs, setInputs] = useState<ProductInputs>({
    cost: 0,
    currentPrice: 0,
    competitorPrices: '',
    conversionRate: 15,
    sessions: 300,
    reviewRating: 4.5,
    reviewCount: 42,
    priceCompetitiveness: 0.92,
    inventoryHealth: 0.8,
    weight: 1.2,
    volume: 0.05,
  });

  const [results, setResults] = useState<{
    optimalPrice: number;
    profit: number;
    margin: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateOptimalPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate inputs
      if (inputs.cost <= 0 || inputs.currentPrice <= 0) {
        throw new Error('Cost and current price must be greater than 0');
      }

      // Parse competitor prices
      const competitorPrices = inputs.competitorPrices
        .split(',')
        .map((price) => parseFloat(price.trim()))
        .filter((price) => !isNaN(price));

      if (competitorPrices.length === 0) {
        throw new Error('Please enter at least one valid competitor price');
      }

      // Calculate product score
      const productScore = AmazonAlgorithms.calculateProductScore({
        conversionRate: inputs.conversionRate,
        sessions: inputs.sessions,
        reviewRating: inputs.reviewRating,
        reviewCount: inputs.reviewCount,
        priceCompetitiveness: inputs.priceCompetitiveness,
        inventoryHealth: inputs.inventoryHealth,
        weight: inputs.weight,
        volume: inputs.volume,
        category: ProductCategory.STANDARD,
      });

      // Calculate optimal price
      const optimalPrice = AmazonAlgorithms.calculateOptimalPrice({
        currentPrice: inputs.currentPrice,
        competitorPrices,
        productScore: productScore / 100,
      });

      // Calculate profit and margin
      const profit = optimalPrice - inputs.cost;
      const margin = (profit / optimalPrice) * 100;

      setResults({
        optimalPrice,
        profit,
        margin,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Optimal Price Calculator</h2>
        <form onSubmit={calculateOptimalPrice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Product Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                value={inputs.cost}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current Price</Label>
              <Input
                id="currentPrice"
                name="currentPrice"
                type="number"
                step="0.01"
                value={inputs.currentPrice}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="competitorPrices">
                Competitor Prices (comma-separated)
              </Label>
              <Input
                id="competitorPrices"
                name="competitorPrices"
                value={inputs.competitorPrices}
                onChange={handleInputChange}
                placeholder="19.99, 24.99, 22.99"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Calculate Optimal Price
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xl font-semibold">Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-100 rounded">
                <div className="text-sm text-green-700">Optimal Price</div>
                <div className="text-2xl font-bold">
                  ${results.optimalPrice.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-blue-100 rounded">
                <div className="text-sm text-blue-700">Estimated Profit</div>
                <div className="text-2xl font-bold">
                  ${results.profit.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-purple-100 rounded">
                <div className="text-sm text-purple-700">Profit Margin</div>
                <div className="text-2xl font-bold">
                  {results.margin.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
