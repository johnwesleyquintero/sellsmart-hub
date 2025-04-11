'use client';

import type React from 'react';

import { Button } from '@/components/ui/button'; // Reusable Button component
import { Card, CardContent } from '@/components/ui/card'; // Reusable Card components
import { Input } from '@/components/ui/input'; // Reusable Input component
import { Label } from '@/components/ui/label'; // Reusable Label component
import { Progress } from '@/components/ui/progress'; // Reusable Progress component
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Reusable Table components
import { AlertCircle, Download, FileUp, Info, Upload } from 'lucide-react';
import Papa from 'papaparse';
import { useRef, useState } from 'react';

type ProductData = {
  product: string;
  cost: number;
  price: number;
  fees: number;
  profit?: number;
  roi?: number;
  margin?: number;
};

export default function FbaCalculator() {
  const [csvData, setCsvData] = useState<ProductData[]>([]);
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

    Papa.parse<FBAData>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError(
            `Error parsing CSV file: ${result.errors[0].message}. Please check the format.`,
          );
          setIsLoading(false);
          return;
        }

        try {
          const validData = result.data
            .filter((item: FBAData) => {
              return (
                item.product &&
                !isNaN(Number(item.cost)) &&
                !isNaN(Number(item.price)) &&
                !isNaN(Number(item.fees))
              );
            })
            .map((item: FBAData) => ({
              product: String(item.product),
              cost: Number(item.cost),
              price: Number(item.price),
              fees: Number(item.fees),
            }));

          if (validData.length === 0) {
            setError(
              'No valid data found in CSV. Please ensure your CSV has columns: product, cost, price, fees',
            );
            setIsLoading(false);
            return;
          }

          setCsvData(validData);
          calculateProfit(validData);
          setIsLoading(false);
        } catch {
          setError(
            'Failed to process CSV data. Please ensure your CSV has columns: product, cost, price, fees',
          );
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV file: ${error.message}`);
        setIsLoading(false);
      },
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateProfit = (data: ProductData[]) => {
    const calculatedResults = data.map((item) => {
      const profit = item.price - item.cost - item.fees;
      const roi = (profit / item.cost) * 100;
      const margin = (profit / item.price) * 100;
      return { ...item, profit, roi, margin };
    });
    setResults(calculatedResults);
  };

  const handleManualCalculation = () => {
    if (
      !manualProduct.product ||
      manualProduct.cost <= 0 ||
      manualProduct.price <= 0
    ) {
      setError('Please fill in all fields with valid values');
      return;
    }

    setError(null);
    const newData = [...csvData, manualProduct];
    setCsvData(newData);
    calculateProfit(newData);

    // Reset form
    setManualProduct({
      product: '',
      cost: 0,
      price: 0,
      fees: 0,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualProduct({
      ...manualProduct,
      [name]: name === 'product' ? value : Number.parseFloat(value) || 0,
    });
  };

  const handleExport = () => {
    if (results.length === 0) {
      setError('No data to export');
      return;
    }

    // Create CSV content
    const csv = Papa.unparse(results);

    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fba_calculator_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearData = () => {
    setCsvData([]);
    setResults([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Your CSV file should have the following columns:{' '}
            <code>product</code>, <code>cost</code>, <code>price</code>,{' '}
            <code>fees</code>
          </p>
          <p className="mt-1">
            Example: <code>product,cost,price,fees</code>
            <br />
            <code>Wireless Earbuds,22.50,49.99,7.25</code>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Upload CSV</h3>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV file with columns: product, cost, price, fees
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    ref={fileInputRef}
                  />
                  <FileUp className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                {results.length > 0 && (
                  <Button variant="outline" onClick={clearData}>
                    Clear Data
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Manual Entry</h3>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product Name</Label>
                <Input
                  id="product"
                  name="product"
                  value={manualProduct.product}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Product Cost ($)</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.cost}
                  onChange={handleInputChange}
                  placeholder="Enter product cost"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Selling Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.price}
                  onChange={handleInputChange}
                  placeholder="Enter selling price"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fees">Amazon Fees ($)</Label>
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualProduct.fees}
                  onChange={handleInputChange}
                  placeholder="Enter FBA fees"
                />
              </div>
              <Button onClick={handleManualCalculation} className="w-full">
                Calculate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={45} className="h-2" />
          <p className="text-sm text-muted-foreground">Processing data...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Results</h3>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Cost ($)</TableHead>
                  <TableHead className="text-right">Price ($)</TableHead>
                  <TableHead className="text-right">Fees ($)</TableHead>
                  <TableHead className="text-right">Profit ($)</TableHead>
                  <TableHead className="text-right">ROI (%)</TableHead>
                  <TableHead className="text-right">Margin (%)</TableHead>
                  <TableHead>Profitability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.product}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.fees.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${item.profit && item.profit < 0 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {item.profit?.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right ${item.roi && item.roi < 0 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {item.roi?.toFixed(2)}%
                    </TableCell>
                    <TableCell
                      className={`text-right ${item.margin && item.margin < 0 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {item.margin?.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress
                          value={
                            item.margin && item.margin > 0
                              ? Math.min(item.margin, 100)
                              : 0
                          }
                          className={`h-2 ${item.margin && item.margin < 15 ? 'bg-red-200' : item.margin && item.margin < 30 ? 'bg-yellow-200' : 'bg-green-200'}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">How to use this calculator:</h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Upload a CSV file with columns: product, cost, price, fees</li>
          <li>Or manually enter product details in the form</li>
          <li>View calculated profit, ROI, and profit margin</li>
          <li>
            Use the results to make informed decisions about your FBA products
          </li>
          <li>Export the results to CSV for further analysis</li>
        </ol>
      </div>
    </div>
  );
}
