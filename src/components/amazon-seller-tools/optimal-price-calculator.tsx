'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AmazonAlgorithms } from '@/lib/amazon-tools/amazon-algorithms';
import {
  validateOptimalPriceInputs,
  type OptimalPriceInputs,
} from '@/lib/amazon-tools/optimal-price-schema';
import { ProductCategory } from '@/lib/amazon-types';
import { logger } from '@/lib/logger';
import { useState } from 'react';

export default function OptimalPriceCalculator() {
  const { toast } = useToast();
  const [inputs, setInputs] = useState<OptimalPriceInputs>({
    cost: 0,
    currentPrice: 0,
    competitorPrices: '',
    reviewRating: 4.5,
    reviewCount: 42,
    priceCompetitiveness: 0.92,
    inventoryHealth: 0.8,
    weight: 1.2,
    volume: 0.05,
    reviews: null,
    salesRank: 1000,
    price: 25,
    category: ProductCategory.STANDARD,
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

  const handleCategoryChange = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      category: value as ProductCategory,
    }));
  };

  const calculateOptimalPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate all inputs using Zod schema
      const validationResult = validateOptimalPriceInputs(inputs);

      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Invalid input data');
      }

      const validatedInputs = validationResult.data;
      const competitorPrices = validatedInputs.competitorPrices;

      // Calculate product score with validated inputs
      const productScore = AmazonAlgorithms.calculateProductScore({
        reviews: validatedInputs.reviews,
        rating: validatedInputs.reviewRating,
        salesRank: validatedInputs.salesRank,
        price: validatedInputs.price,
        category: validatedInputs.category,
      });

      // Calculate optimal price
      const optimalPrice = AmazonAlgorithms.calculateOptimalPrice({
        currentPrice: validatedInputs.currentPrice,
        competitorPrices,
        productScore: productScore / 100,
      });

      // Calculate profit and margin
      const profit = optimalPrice - validatedInputs.cost;
      const margin = (profit / optimalPrice) * 100;

      // Log successful calculation
      logger.info('Optimal price calculated successfully', {
        component: 'OptimalPriceCalculator',
        inputs: validatedInputs,
        results: { optimalPrice, profit, margin },
      });

      setResults({
        optimalPrice,
        profit,
        margin,
      });

      toast({
        title: 'Calculation Complete',
        description: `Optimal price calculated: $${optimalPrice.toFixed(2)}`,
      });
    } catch (err) {
      // Log error and show user-friendly message
      logger.error('Error calculating optimal price', {
        component: 'OptimalPriceCalculator',
        error: err instanceof Error ? err.message : 'Unknown error',
        inputs,
      });

      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      toast({
        title: 'Calculation Error',
        description: errorMessage,
        variant: 'destructive',
      });
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

            <div className="space-y-2">
              <Label htmlFor="category">Product Category</Label>
              <Select
                value={inputs.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProductCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
