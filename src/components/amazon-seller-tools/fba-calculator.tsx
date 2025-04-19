'use client';

import { useToast } from '@/hooks/use-toast'; // Added for user feedback
import {
  AlertCircle,
  Calculator,
  Download,
  FileText,
  Info,
  Upload,
  XCircle, // Added for error dismiss and clear button
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react'; // Added useCallback, useRef

// Local/UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DataCard from './DataCard'; // Use consistent DataCard
import SampleCsvButton from './sample-csv-button'; // Add sample button

// --- Types ---
// Input structure expected from CSV or manual entry
interface FbaCalculationInput {
  product: string;
  cost: number;
  price: number;
  fees: number;
}

// Result structure including calculated metrics
interface FbaCalculationResult extends FbaCalculationInput {
  profit: number;
  roi: number; // Return on Investment (%)
  margin: number; // Profit Margin (%)
}

// Type for raw CSV row after parsing
interface CsvInputRow {
  product?: string | null;
  cost?: number | string | null;
  price?: number | string | null;
  fees?: number | string | null;
}

// --- Helper Functions ---

/**
 * Calculates profit, ROI, and margin for a single product.
 * Handles potential division by zero.
 */
const calculateFbaMetrics = (
  input: FbaCalculationInput,
): Pick<FbaCalculationResult, 'profit' | 'roi' | 'margin'> => {
  const { cost, price, fees } = input;

  const profit = price - cost - fees;
  // ROI: Handle zero cost to avoid division by zero (returns Infinity if profit > 0, 0 if profit = 0, -Infinity if profit < 0)
  const roi = cost > 0 ? (profit / cost) * 100 : (profit > 0 ? Infinity : (profit < 0 ? -Infinity : 0));
  // Margin: Handle zero price to avoid division by zero (returns 0 if profit is also 0, otherwise +/- Infinity)
  const margin = price > 0 ? (profit / price) * 100 : (profit === 0 ? 0 : (profit > 0 ? Infinity : -Infinity));


  return {
    profit,
    roi,
    margin,
  };
};

// --- Component ---
export default function FbaCalculator() {
  const { toast } = useToast();
  const [results, setResults] = useState<FbaCalculationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Simplified state for manual input form
  const [manualInput, setManualInput] = useState<FbaCalculationInput>({
    product: '',
    cost: 0,
    price: 0,
    fees: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setResults([]); // Clear previous results

      Papa.parse<CsvInputRow>(file, {
        header: true,
        dynamicTyping: false, // Parse everything as string initially for better validation control
        skipEmptyLines: true,
        complete: (result) => {
          try {
            if (result.errors.length > 0) {
              throw new Error(
                `CSV parsing error: ${result.errors[0].message}. Check row ${result.errors[0].row}.`,
              );
            }

            // Validate required headers (case-insensitive)
            const requiredHeaders = ['product', 'cost', 'price', 'fees'];
            const actualHeaders = result.meta.fields?.map(h => h.toLowerCase()) || [];
            const missingHeaders = requiredHeaders.filter(
              (header) => !actualHeaders.includes(header),
            );

            if (missingHeaders.length > 0) {
              throw new Error(
                `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${result.meta.fields?.join(', ') || 'None'}`,
              );
            }

            let skippedRowCount = 0;
            // Process the parsed data
            const processedResults: FbaCalculationResult[] = result.data
              .map((row, index) => {
                const productName = row.product?.trim();
                const costStr = row.cost?.trim();
                const priceStr = row.price?.trim();
                const feesStr = row.fees?.trim();

                // Validate product name
                if (!productName) {
                  console.warn(`Skipping row ${index + 2}: Missing product name.`);
                  skippedRowCount++;
                  return null;
                }

                // Validate and convert numeric values
                const cost = Number(costStr);
                const price = Number(priceStr);
                const fees = Number(feesStr);

                if (isNaN(cost) || cost < 0) {
                  console.warn(`Skipping row ${index + 2} for "${productName}": Invalid or negative cost value ('${costStr}').`);
                  skippedRowCount++;
                  return null;
                }
                if (isNaN(price) || price < 0) {
                  console.warn(`Skipping row ${index + 2} for "${productName}": Invalid or negative price value ('${priceStr}').`);
                  skippedRowCount++;
                  return null;
                }
                if (isNaN(fees) || fees < 0) {
                   console.warn(`Skipping row ${index + 2} for "${productName}": Invalid or negative fees value ('${feesStr}').`);
                   skippedRowCount++;
                   return null;
                }

                const inputData: FbaCalculationInput = { product: productName, cost, price, fees };
                const metrics = calculateFbaMetrics(inputData);

                return { ...inputData, ...metrics };
              })
              .filter((item): item is FbaCalculationResult => item !== null); // Filter out null results

            if (processedResults.length === 0) {
                if (result.data.length > 0) {
                    throw new Error(`No valid data found in the CSV after processing ${result.data.length} rows. Ensure 'product', 'cost', 'price', 'fees' columns are present and contain valid non-negative numbers.`);
                } else {
                    throw new Error("The uploaded CSV file appears to be empty or contains no data rows.");
                }
            }

            setResults(processedResults);
            setError(skippedRowCount > 0 ? `Processed ${processedResults.length} products. Skipped ${skippedRowCount} invalid rows.` : null); // Inform about skipped rows as a non-blocking error/info
            toast({
              title: 'CSV Processed',
              description: `Successfully calculated FBA metrics for ${processedResults.length} products.${skippedRowCount > 0 ? ` Skipped ${skippedRowCount} invalid rows.` : ''}`,
              variant: 'default',
            });

          } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred during processing.';
            setError(message);
            setResults([]); // Clear any partial data on error
            toast({
              title: 'Processing Failed',
              description: message,
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
            // Reset file input value to allow re-uploading the same file
            if (event.target) {
              event.target.value = '';
            }
          }
        },
        error: (err: Error) => {
          setError(`Error reading CSV file: ${err.message}`);
          setIsLoading(false);
          setResults([]);
          toast({
            title: 'Upload Failed',
            description: `Error reading CSV file: ${err.message}`,
            variant: 'destructive',
          });
          // Reset file input on read error too
          if (event.target) {
            event.target.value = '';
          }
        },
      });
    },
    [toast], // Added toast dependency
  );

  const handleManualCalculation = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission if it were inside a form
    setError(null);

    const { product, cost, price, fees } = manualInput;
    const trimmedProduct = product.trim();

    // Validation
    if (!trimmedProduct) {
      const msg = 'Product name cannot be empty.';
      setError(msg);
      toast({ title: 'Input Error', description: msg, variant: 'destructive' });
      return;
    }
    // cost, price, fees are already numbers due to handleInputChange, check if they are positive/non-negative
    if (cost <= 0) {
      const msg = 'Product Cost must be a positive number.';
      setError(msg);
      toast({ title: 'Input Error', description: msg, variant: 'destructive' });
      return;
    }
    if (price <= 0) {
      const msg = 'Selling Price must be a positive number.';
      setError(msg);
      toast({ title: 'Input Error', description: msg, variant: 'destructive' });
      return;
    }
     if (fees < 0) {
       const msg = 'Amazon Fees cannot be negative.';
       setError(msg);
       toast({ title: 'Input Error', description: msg, variant: 'destructive' });
       return;
     }
    // Optional: Check if price covers cost + fees
    if (price <= cost + fees) {
        toast({
            title: 'Potential Loss',
            description: 'Warning: Selling price does not cover cost and fees.',
            variant: 'default', // Use a warning variant if available
        });
    }

    const inputData: FbaCalculationInput = { product: trimmedProduct, cost, price, fees };
    const metrics = calculateFbaMetrics(inputData);
    const newResult: FbaCalculationResult = { ...inputData, ...metrics };

    setResults((prevResults) => [...prevResults, newResult]);

    // Reset form
    setManualInput({ product: '', cost: 0, price: 0, fees: 0 });
    toast({
        title: 'Calculation Added',
        description: `Added calculation for "${trimmedProduct}".`,
        variant: 'default',
    });

  }, [manualInput, toast]); // Added dependencies

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualInput((prev) => ({
      ...prev,
      // For numeric fields, convert to number, default to 0 if conversion fails or empty
      [name]: name === 'product' ? value : (Number(value) || 0),
    }));
  }, []); // No dependencies

  const handleExport = useCallback(() => {
    if (results.length === 0) {
      const msg = 'No data to export.';
      setError(msg);
      toast({ title: 'Export Error', description: msg, variant: 'destructive' });
      return;
    }
    setError(null);

    // Prepare data for CSV export, formatting numbers
    const exportData = results.map((item) => ({
      Product: item.product,
      Cost: item.cost.toFixed(2),
      Price: item.price.toFixed(2),
      Fees: item.fees.toFixed(2),
      Profit: item.profit.toFixed(2),
      ROI_Percent: isFinite(item.roi) ? item.roi.toFixed(2) : 'Infinity', // Handle Infinity
      Margin_Percent: isFinite(item.margin) ? item.margin.toFixed(2) : 'Infinity', // Handle Infinity
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fba_calculator_results.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up blob URL
      toast({ title: 'Export Successful', description: 'FBA calculation results exported to CSV.', variant: 'default' });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred during export.';
        setError(`Failed to export data: ${message}`);
        toast({ title: 'Export Failed', description: message, variant: 'destructive' });
    }
  }, [results, toast]); // Added dependencies

  const clearData = useCallback(() => {
    setResults([]);
    setError(null);
    setManualInput({ product: '', cost: 0, price: 0, fees: 0 }); // Reset manual form
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    toast({ title: 'Data Cleared', description: 'All calculation results have been removed.', variant: 'default' });
  }, [toast]); // Added dependency

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How it Works:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Upload a CSV with `product`, `cost`, `price`, and `fees` columns.</li>
            <li>Or, manually enter details for a single product.</li>
            <li>The tool calculates Profit, Return on Investment (ROI), and Profit Margin.</li>
            <li>Export the results to a new CSV file.</li>
            <li>Ensure all monetary values (`cost`, `price`, `fees`) are non-negative numbers.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CSV Upload Card */}
        <DataCard>
          {/* CardContent is implicitly handled by DataCard, adjust padding via className if needed */}
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload FBA Data CSV</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bulk calculate profit metrics from a CSV file
              </p>
            </div>
            <div className="w-full">
              <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  Click or drag CSV file here
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Requires: product, cost, price, fees)
                </span>
                <input
                  type="file"
                  accept=".csv, text/csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  ref={fileInputRef}
                />
              </label>
              <div className="flex justify-center mt-4">
                <SampleCsvButton
                  dataType="fba" // Ensure this type exists in your sample data generator
                  fileName="sample-fba-calculator.csv"
                />
              </div>
            </div>
          </div>
        </DataCard>

        {/* Manual Entry Card */}
        <DataCard>
          <CardContent className="p-6"> {/* Explicit CardContent for padding control */}
            <h3 className="text-lg font-medium mb-4 text-center sm:text-left">Manual Calculation</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-product" className="text-sm font-medium">Product Name*</Label>
                <Input
                  id="manual-product"
                  name="product" // Match state key
                  type="text"
                  value={manualInput.product}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="manual-cost" className="text-sm font-medium">Product Cost ($)*</Label>
                <Input
                  id="manual-cost"
                  name="cost" // Match state key
                  type="number"
                  min="0.01" // Cost should be positive
                  step="0.01"
                  value={manualInput.cost || ''} // Show empty string instead of 0 initially
                  onChange={handleInputChange}
                  placeholder="e.g., 10.50"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="manual-price" className="text-sm font-medium">Selling Price ($)*</Label>
                <Input
                  id="manual-price"
                  name="price" // Match state key
                  type="number"
                  min="0.01" // Price should be positive
                  step="0.01"
                  value={manualInput.price || ''} // Show empty string instead of 0 initially
                  onChange={handleInputChange}
                  placeholder="e.g., 29.99"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="manual-fees" className="text-sm font-medium">Amazon Fees ($)*</Label>
                <Input
                  id="manual-fees"
                  name="fees" // Match state key
                  type="number"
                  min="0" // Fees can be zero
                  step="0.01"
                  value={manualInput.fees || ''} // Show empty string instead of 0 initially
                  onChange={handleInputChange}
                  placeholder="e.g., 5.75"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleManualCalculation}
                className="w-full"
                disabled={isLoading || !manualInput.product || manualInput.cost <= 0 || manualInput.price <= 0 || manualInput.fees < 0}
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isLoading ? 'Calculating...' : 'Calculate & Add'}
              </Button>
            </div>
          </CardContent>
        </DataCard>
      </div>

      {/* Action Buttons (Export/Clear) */}
      {results.length > 0 && !isLoading && (
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button variant="destructive" onClick={clearData} disabled={isLoading}>
            <XCircle className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-grow break-words">{error}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setError(null)}
            className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0"
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" /> {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">
            Processing data...
          </p>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-0"> {/* Remove default padding for table */}
            <h3 className="text-lg font-semibold p-4 border-b">
              Calculation Results ({results.length} Products)
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-4 py-3 text-left font-medium whitespace-nowrap">Product</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">Cost ($)</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">Price ($)</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">Fees ($)</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">Profit ($)</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">ROI (%)</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium whitespace-nowrap">Margin (%)</TableHead>
                    <TableHead className="px-4 py-3 text-center font-medium whitespace-nowrap">Profitability (Margin)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => {
                    const profitColor = item.profit < 0 ? 'text-red-500' : 'text-green-500';
                    const roiDisplay = isFinite(item.roi) ? `${item.roi.toFixed(2)}%` : '∞';
                    const marginDisplay = isFinite(item.margin) ? `${item.margin.toFixed(2)}%` : '∞';
                    // Cap margin at 100 for progress bar, treat negative as 0
                    const progressValue = Math.max(0, Math.min(item.margin, 100));

                    return (
                      <TableRow key={`${item.product}-${index}`} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <TableCell className="px-4 py-3 font-medium">{item.product}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{item.cost.toFixed(2)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{item.price.toFixed(2)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">{item.fees.toFixed(2)}</TableCell>
                        <TableCell className={`px-4 py-3 text-right font-semibold ${profitColor}`}>
                          {item.profit.toFixed(2)}
                        </TableCell>
                        <TableCell className={`px-4 py-3 text-right ${item.roi < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {roiDisplay}
                        </TableCell>
                        <TableCell className={`px-4 py-3 text-right ${item.margin < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {marginDisplay}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="w-full min-w-[100px]"> {/* Ensure progress bar has some width */}
                            <Progress
                              value={isFinite(progressValue) ? progressValue : 0}
                              className="h-2"
                              // Optional: Add color based on value
                              // indicatorClassName={progressValue < 10 ? 'bg-red-500' : progressValue < 25 ? 'bg-yellow-500' : 'bg-green-500'}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </DataCard>
      )}

      {/* How to Use Section (Optional: Can be inside a DataCard too) */}
      {!isLoading && (
        <Card className="bg-muted/20">
            <CardContent className="p-4">
                <h4 className="font-semibold mb-2 text-sm">How to use this calculator:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Upload a CSV file with columns: product, cost, price, fees</li>
                <li>Or manually enter product details in the form</li>
                <li>View calculated profit, ROI, and profit margin</li>
                <li>
                    Use the results to make informed decisions about your FBA products
                </li>
                <li>Export the results to CSV for further analysis</li>
                </ol>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
