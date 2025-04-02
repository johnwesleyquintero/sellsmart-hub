'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, Progress } from '@/components/ui';
import { Upload, AlertCircle, Download, Percent } from 'lucide-react';
import Papa from 'papaparse';
import SampleCsvButton from './sample-csv-button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { ChartContainer } from '@/components/ui';

type ProductData = {
  product: string;
  cost: number;
  price: number;
  fees: number;
  profit?: number;
  roi?: number;
  margin?: number;
};

export default function ProfitMarginCalculator() {
  const [, setCsvData] = useState<ProductData[]>([]);
  const [results, setResults] = useState<ProductData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [manualProduct, setManualProduct] = useState<ProductData>({
    product: '',
    cost: 0,
    price: 0,
    fees: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setIsLoading(true);
    const file = event.target.files?.[0];
    if (!file) {
      setIsLoading(false);
      return;
    }

    Papa.parse<ProductData>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          // Validate required columns
          const requiredColumns = ['product', 'cost', 'price', 'fees'];
          const missingColumns = requiredColumns.filter(
            (col) => !result.meta.fields.includes(col),
          );

          if (missingColumns.length > 0) {
            throw new Error(
              `Missing required columns: ${missingColumns.join(', ')}`,
            );
          }

          const processedData = result.data.map((item: ProductData) => ({
            product: item.product || '',
            cost: Number(item.cost) || 0,
            price: Number(item.price) || 0,
            fees: Number(item.fees) || 0,
          }));

          if (processedData.length === 0) {
            throw new Error('No valid data found in CSV');
          }

          setCsvData(processedData);
          calculateResults(processedData);
        } catch (err) {
          setError(`Error processing CSV file: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setIsLoading(false);
      },
    });
  };

  const calculateResults = (data: ProductData[]) => {
    if (!data || data.length === 0) {
      setError('No valid data to calculate');
      return;
    }

    const calculated = data.map((item) => {
      const productScore = AmazonAlgorithms.calculateProductScore({
        conversionRate: item.conversionRate || 15,
        sessions: item.sessions || 300,
        reviewRating: item.reviewRating || 4.5,
        reviewCount: item.reviewCount || 42,
        priceCompetitiveness: item.priceCompetitiveness || 0.92,
        inventoryHealth: item.inventoryHealth || 0.8,
        weight: item.weight || 1.2,
        volume: item.volume || 0.05,
        category: ProductCategory.STANDARD,
      });

      const adjustedPrice = AmazonAlgorithms.calculateOptimalPrice(
        item.price,
        item.competitorPrices || [item.price * 0.9, item.price * 1.1],
        productScore / 100,
      );

      const profit = adjustedPrice - item.cost - item.fees;
      const margin = (profit / item.price) * 100;
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

  const handleManualSubmit = (e: React.FormEvent) => {
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
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <ChartContainer
          config={{
            profit: {
              label: 'Profit',
              theme: { light: '#10b981', dark: '#10b981' },
            },
            roi: { label: 'ROI', theme: { light: '#3b82f6', dark: '#3b82f6' } },
            margin: {
              label: 'Margin',
              theme: { light: '#8b5cf6', dark: '#8b5cf6' },
            },
          }}
          className="h-[400px] mb-6"
        >
          {(width, height) => (
            <BarChart width={width} height={height} data={results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="profit" name="Profit" fill="#10b981" />
              <Bar dataKey="roi" name="ROI" fill="#3b82f6" />
              <Bar dataKey="margin" name="Margin" fill="#8b5cf6" />
            </BarChart>
          )}
        </ChartContainer>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Percent className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Profit Margin Calculator</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-upload">Upload CSV File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </Button>
                  <SampleCsvButton toolName="profit-margin" />
                </div>
                <p className="text-sm text-muted-foreground">
                  CSV should have columns: product, cost, price, fees
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Or Enter Manually</h3>
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="product">Product Name</Label>
                    <Input
                      id="product"
                      value={manualProduct.product}
                      onChange={(e) =>
                        setManualProduct({
                          ...manualProduct,
                          product: e.target.value,
                        })
                      }
                      placeholder="Product name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost">Product Cost ($)</Label>
                    <Input
                      id="cost"
                      type="number"
                      value={manualProduct.cost || ''}
                      onChange={(e) =>
                        setManualProduct({
                          ...manualProduct,
                          cost: e.target.valueAsNumber,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Selling Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={manualProduct.price || ''}
                      onChange={(e) =>
                        setManualProduct({
                          ...manualProduct,
                          price: e.target.valueAsNumber,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fees">Fees ($)</Label>
                    <Input
                      id="fees"
                      type="number"
                      value={manualProduct.fees || ''}
                      onChange={(e) =>
                        setManualProduct({
                          ...manualProduct,
                          fees: e.target.valueAsNumber,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Calculate
                  </Button>
                </form>
              </div>
            </div>

            <div className="space-y-4">
              {isLoading && <Progress value={33} className="h-2" />}
              {error && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Results</h3>
                  <div className="rounded-md border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={results}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="product" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="profit"
                              fill="#10b981"
                              name="Profit ($)"
                            />
                            <Bar
                              dataKey="cost"
                              fill="#ef4444"
                              name="Cost ($)"
                            />
                            <Bar
                              dataKey="fees"
                              fill="#f59e0b"
                              name="Fees ($)"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={results}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="product" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="#ff7300"
                              name="Price"
                            />
                            <Line
                              type="monotone"
                              dataKey="cost"
                              stroke="#387908"
                              name="Cost"
                            />
                            <Line
                              type="monotone"
                              dataKey="fees"
                              stroke="#ff0000"
                              name="Fees"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.product}</TableCell>
                          <TableCell className="text-right">
                            ${result.profit?.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {result.margin}%
                          </TableCell>
                          <TableCell className="text-right">
                            {result.roi}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export as CSV
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export as PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
