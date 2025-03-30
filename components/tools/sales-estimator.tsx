'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {} from '@/lib/core-utils';
import {
  Upload,
  FileText,
  AlertCircle,
  Download,
  TrendingUp,
} from 'lucide-react';

type ProductData = {
  product: string;
  category: string;
  price: number;
  competition: 'Low' | 'Medium' | 'High';
  estimatedSales: number;
  estimatedRevenue: number;
  confidence: 'Low' | 'Medium' | 'High';
};

export default function SalesEstimator() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualProduct, setManualProduct] = useState({
    product: '',
    category: '',
    price: '',
    competition: 'Medium' as 'Low' | 'Medium' | 'High',
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    // Simulate CSV parsing
    setTimeout(() => {
      try {
        // This is a simulation - in a real app, you'd use Papa Parse or similar
        const sampleData = [
          {
            product: 'Wireless Earbuds',
            category: 'Electronics',
            price: 39.99,
            competition: 'High' as 'Low' | 'Medium' | 'High',
          },
          {
            product: 'Phone Case',
            category: 'Phone Accessories',
            price: 19.99,
            competition: 'Medium' as 'Low' | 'Medium' | 'High',
          },
          {
            product: 'Charging Cable',
            category: 'Electronics',
            price: 12.99,
            competition: 'Low' as 'Low' | 'Medium' | 'High',
          },
        ];

        const processedData = sampleData.map((item) => {
          // This is a simplified sales estimation algorithm
          // In a real app, you'd have a more sophisticated algorithm
          let baseSales = 0;

          // Category factor
          if (item.category === 'Electronics') baseSales = 150;
          else if (item.category === 'Phone Accessories') baseSales = 200;
          else baseSales = 100;

          // Price factor
          const priceFactor =
            item.price < 20 ? 1.5 : item.price < 50 ? 1.0 : 0.7;

          // Competition factor
          const competitionFactor =
            item.competition === 'Low'
              ? 1.3
              : item.competition === 'Medium'
                ? 1.0
                : 0.7;

          // Calculate estimated sales
          const estimatedSales = Math.round(
            baseSales * priceFactor * competitionFactor,
          );
          const estimatedRevenue = estimatedSales * item.price;

          // Determine confidence level
          let confidence: 'Low' | 'Medium' | 'High' = 'Medium';
          if (item.competition === 'Low' && item.price < 30)
            confidence = 'High';
          else if (item.competition === 'High' && item.price > 50)
            confidence = 'Low';

          return {
            ...item,
            estimatedSales,
            estimatedRevenue,
            confidence,
          };
        });

        setProducts(processedData);
        setIsLoading(false);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to parse CSV file. Please check the format and try again.';
        setError(errorMessage);
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleManualEstimate = () => {
    if (
      !manualProduct.product ||
      !manualProduct.category ||
      !manualProduct.price
    ) {
      setError('Please fill in all fields');
      return;
    }

    const price = Number.parseFloat(manualProduct.price);

    if (isNaN(price)) {
      setError('Please enter a valid price');
      return;
    }

    // This is a simplified sales estimation algorithm
    // In a real app, you'd have a more sophisticated algorithm
    let baseSales = 0;

    // Category factor
    if (manualProduct.category === 'Electronics') baseSales = 150;
    else if (manualProduct.category === 'Phone Accessories') baseSales = 200;
    else baseSales = 100;

    // Price factor
    const priceFactor = price < 20 ? 1.5 : price < 50 ? 1.0 : 0.7;

    // Competition factor
    const competitionFactor =
      manualProduct.competition === 'Low'
        ? 1.3
        : manualProduct.competition === 'Medium'
          ? 1.0
          : 0.7;

    // Calculate estimated sales
    const estimatedSales = Math.round(
      baseSales * priceFactor * competitionFactor,
    );
    const estimatedRevenue = estimatedSales * price;

    // Determine confidence level
    let confidence: 'Low' | 'Medium' | 'High' = 'Medium';
    if (manualProduct.competition === 'Low' && price < 30) confidence = 'High';
    else if (manualProduct.competition === 'High' && price > 50)
      confidence = 'Low';

    const newProduct: ProductData = {
      product: manualProduct.product,
      category: manualProduct.category,
      price,
      competition: manualProduct.competition,
      estimatedSales,
      estimatedRevenue,
      confidence,
    };

    setProducts([...products, newProduct]);
    setManualProduct({
      product: '',
      category: '',
      price: '',
      competition: 'Medium',
    });
    setError(null);
  };

  const handleExport = () => {
    // In a real app, this would generate and download a CSV file
    alert(
      'In a real implementation, this would download a CSV with all sales estimates.',
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with your product data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with product name, category, price, and competition
                    level)
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium">Manual Estimate</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Product Name</label>
                  <Input
                    value={manualProduct.product}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        product: e.target.value,
                      })
                    }
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={manualProduct.category}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        category: e.target.value,
                      })
                    }
                    placeholder="Enter product category"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualProduct.price}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        price: e.target.value,
                      })
                    }
                    placeholder="Enter product price"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Competition Level
                  </label>
                  <select
                    value={manualProduct.competition}
                    onChange={(e) =>
                      setManualProduct({
                        ...manualProduct,
                        competition: e.target.value as
                          | 'Low'
                          | 'Medium'
                          | 'High',
                      })
                    }
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <Button onClick={handleManualEstimate} className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Estimate Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={45} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Estimating sales potential...
          </p>
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Estimates
            </Button>
          </div>

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      Competition
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Est. Monthly Sales
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium">
                      Est. Monthly Revenue
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 text-sm">{product.product}</td>
                      <td className="px-4 py-3 text-sm">{product.category}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            product.competition === 'Low'
                              ? 'default'
                              : product.competition === 'Medium'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {product.competition}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {product.estimatedSales.toLocaleString()} units
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        ${product.estimatedRevenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            product.confidence === 'High'
                              ? 'default'
                              : product.confidence === 'Medium'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {product.confidence}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="mb-2 text-sm font-medium">Estimation Methodology</h3>
            <p className="text-sm text-muted-foreground">
              These estimates are based on category averages, price points, and
              competition levels. Actual sales may vary based on additional
              factors such as listing quality, reviews, advertising, and
              seasonality. High confidence estimates are more likely to be
              accurate.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
