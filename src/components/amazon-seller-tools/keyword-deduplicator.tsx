'use client';

import { useToast } from '@/hooks/use-toast'; // Added for user feedback
import {
  AlertCircle,
  Download,
  FileText,
  Filter,
  Info,
  Upload,
  XCircle, // Added for error dismiss
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react'; // Added useCallback

// Local/UI Imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Added Input
import { Label } from '@/components/ui/label'; // Added Label
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import DataCard from './DataCard';
import SampleCsvButton from './sample-csv-button';

// --- Types ---
// Simplified type specific to this tool's output
interface ProcessedKeywordData {
  product: string;
  originalKeywords: string[];
  cleanedKeywords: string[];
  duplicatesRemoved: number;
}

// Type expected from CSV rows after parsing
interface CsvInputRow {
  product?: string | null;
  keywords?: string | null; // Keywords are expected as a single comma-separated string
}

// --- Helper Functions ---

// Extracts and cleans keywords from a string
const extractKeywordsFromString = (
  keywordsString: string | null | undefined,
): string[] => {
  if (!keywordsString) {
    return [];
  }
  return keywordsString
    .split(',')
    .map((k) => k.trim().toLowerCase()) // Trim and convert to lower case for accurate deduplication
    .filter(Boolean); // Remove empty strings
};

// Processes a single row of data (either from CSV or manual entry)
const processKeywordData = (
  productName: string,
  keywordsString: string | null | undefined,
): ProcessedKeywordData | null => {
  const originalKeywords = extractKeywordsFromString(keywordsString);

  if (originalKeywords.length === 0) {
    console.warn(`No valid keywords found for product "${productName}".`);
    return null; // Skip if no keywords
  }

  // Use Set for efficient deduplication
  const cleanedKeywordsSet = new Set(originalKeywords);
  const cleanedKeywords = Array.from(cleanedKeywordsSet);

  return {
    product: productName,
    originalKeywords, // Keep original case/spacing if needed for display, but dedupe was case-insensitive
    cleanedKeywords,
    duplicatesRemoved: originalKeywords.length - cleanedKeywords.length,
  };
};

// --- Component ---
export default function KeywordDeduplicator() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProcessedKeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKeywords, setManualKeywords] = useState('');
  const [manualProduct, setManualProduct] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setProducts([]); // Clear previous results

      Papa.parse<CsvInputRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          try {
            if (result.errors.length > 0) {
              throw new Error(
                `CSV parsing error: ${result.errors[0].message}. Check row ${result.errors[0].row}.`,
              );
            }

            // Validate required headers
            const requiredHeaders = ['product', 'keywords'];
            const actualHeaders =
              result.meta.fields?.map((h) => h.toLowerCase()) || []; // Case-insensitive check
            const missingHeaders = requiredHeaders.filter(
              (header) => !actualHeaders.includes(header),
            );

            if (missingHeaders.length > 0) {
              throw new Error(
                `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${result.meta.fields?.join(', ') || 'None'}`,
              );
            }

            // Process the parsed data
            const processedData: ProcessedKeywordData[] = result.data
              .map((row, index) => {
                const productName = row.product?.trim();
                if (!productName) {
                  console.warn(
                    `Skipping row ${index + 1}: Missing product name.`,
                  );
                  return null;
                }
                // Pass the raw keywords string for processing
                return processKeywordData(productName, row.keywords);
              })
              .filter((item): item is ProcessedKeywordData => item !== null); // Filter out null results

            if (processedData.length === 0) {
              if (result.data.length > 0) {
                throw new Error(
                  "No valid product/keyword data found in the CSV after processing. Ensure 'product' and 'keywords' columns are present and populated.",
                );
              } else {
                throw new Error(
                  'The uploaded CSV file appears to be empty or contains no data rows.',
                );
              }
            }

            setProducts(processedData);
            setError(null); // Clear any previous non-critical errors (like skipped rows info)
            toast({
              title: 'CSV Processed',
              description: `Successfully processed ${processedData.length} products.`,
              variant: 'default',
            });
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'An unknown error occurred during processing.';
            setError(message);
            setProducts([]); // Clear any partial data on error
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
          setProducts([]);
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

  const handleManualProcess = useCallback(() => {
    setError(null); // Clear previous errors
    const trimmedKeywords = manualKeywords.trim();
    const trimmedProduct = manualProduct.trim() || 'Manual Entry'; // Default name if empty

    if (!trimmedKeywords) {
      const msg = 'Please enter keywords to process.';
      setError(msg);
      toast({
        title: 'Input Required',
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicates before adding
    if (
      products.some(
        (p) => p.product.toLowerCase() === trimmedProduct.toLowerCase(),
      )
    ) {
      const msg = `Product "${trimmedProduct}" already exists in the results. Clear existing data or use a different name.`;
      setError(msg);
      toast({
        title: 'Duplicate Product',
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    const result = processKeywordData(trimmedProduct, trimmedKeywords);

    if (result) {
      setProducts((prevProducts) => [...prevProducts, result]);
      setManualKeywords('');
      setManualProduct('');
      toast({
        title: 'Keywords Processed',
        description: `Deduplicated keywords for "${trimmedProduct}". ${result.duplicatesRemoved} duplicates removed.`,
        variant: 'default',
      });
    } else {
      const msg = 'No valid keywords were found in the manual input.';
      setError(msg);
      toast({
        title: 'Processing Error',
        description: msg,
        variant: 'destructive',
      });
    }
  }, [manualKeywords, manualProduct, products, toast]); // Added dependencies

  const handleExport = useCallback(() => {
    if (products.length === 0) {
      const msg = 'No data to export.';
      setError(msg);
      toast({
        title: 'Export Error',
        description: msg,
        variant: 'destructive',
      });
      return;
    }
    setError(null);

    // Prepare data for CSV export
    const exportData = products.map((product) => ({
      Product: product.product,
      Original_Keywords: product.originalKeywords.join(', '), // Join back for CSV
      Cleaned_Keywords: product.cleanedKeywords.join(', '), // Join back for CSV
      Duplicates_Removed: product.duplicatesRemoved,
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'deduplicated_keywords.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up blob URL
      toast({
        title: 'Export Successful',
        description: 'Cleaned keywords exported to CSV.',
        variant: 'default',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during export.';
      setError(`Failed to export data: ${message}`);
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [products, toast]); // Added dependencies

  const clearData = useCallback(() => {
    setProducts([]);
    setError(null);
    setManualKeywords('');
    setManualProduct('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All keyword data has been removed.',
      variant: 'default',
    });
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
            <li>
              Upload a CSV with `product` and comma-separated `keywords`
              columns.
            </li>
            <li>
              Or, manually enter keywords (comma-separated) and an optional
              product name.
            </li>
            <li>
              The tool removes duplicate keywords (case-insensitive) for each
              product.
            </li>
            <li>
              View the original and cleaned keyword lists, plus the number of
              duplicates removed.
            </li>
            <li>Export the cleaned results to a new CSV file.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* CSV Upload Card */}
        <DataCard className="flex-1">
          {/* CardContent is implicitly handled by DataCard, adjust padding via className if needed */}
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload Keywords CSV</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bulk deduplicate keywords from a CSV file
              </p>
            </div>
            <div className="w-full">
              <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  Click or drag CSV file here
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Requires: product, keywords)
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
                  dataType="keyword-dedup" // Ensure this type exists in your sample data generator
                  fileName="sample-keyword-deduplicator.csv"
                />
              </div>
            </div>
          </div>
        </DataCard>

        {/* Manual Entry Card */}
        <DataCard className="flex-1">
          <CardContent className="p-6">
            {' '}
            {/* Explicit CardContent for padding control */}
            <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
              Manual Entry
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-product" className="text-sm font-medium">
                  Product Name (Optional)
                </Label>
                <Input
                  id="manual-product"
                  type="text"
                  value={manualProduct}
                  onChange={(e) => setManualProduct(e.target.value)}
                  placeholder="Enter product name (e.g., T-Shirt)"
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label
                  htmlFor="manual-keywords"
                  className="text-sm font-medium"
                >
                  Keywords*
                </Label>
                <Textarea
                  id="manual-keywords"
                  value={manualKeywords}
                  onChange={(e) => setManualKeywords(e.target.value)}
                  placeholder="Enter comma-separated keywords (e.g., red shirt, cotton shirt, red shirt)"
                  rows={5} // Adjusted rows
                  className="mt-1"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Keywords should be separated by commas.
                </p>
              </div>
              <Button
                onClick={handleManualProcess}
                className="w-full"
                disabled={isLoading || !manualKeywords.trim()}
              >
                <Filter className="mr-2 h-4 w-4" />
                {isLoading ? 'Processing...' : 'Remove Duplicates'}
              </Button>
            </div>
          </CardContent>
        </DataCard>
      </div>

      {/* Action Buttons (Export/Clear) */}
      {products.length > 0 && !isLoading && (
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Cleaned Keywords
          </Button>
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />{' '}
            {/* Changed icon for consistency */}
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
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />{' '}
          {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">
            Processing keywords...
          </p>
        </div>
      )}

      {/* Results Section */}
      {products.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-4 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-3">
              Deduplication Results ({products.length} Products)
            </h2>
            <div className="space-y-4">
              {products.map((product, index) => (
                <Card key={`${product.product}-${index}`}>
                  {' '}
                  {/* Use unique key */}
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                      <h3 className="text-lg font-medium break-all">
                        {product.product}
                      </h3>
                      <Badge
                        variant={
                          product.duplicatesRemoved > 0
                            ? 'default'
                            : 'secondary'
                        }
                        className="whitespace-nowrap self-start sm:self-center"
                      >
                        {getDuplicateMessage(product.duplicatesRemoved)}
                      </Badge>
                    </div>

                    {/* Keywords Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Original Keywords */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                          Original Keywords ({product.originalKeywords.length})
                        </h4>
                        <div className="rounded-lg border bg-muted/30 p-3 min-h-[100px]">
                          {product.originalKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.originalKeywords.map((keyword, i) => (
                                <Badge
                                  key={`orig-${index}-${i}`}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              No original keywords provided.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Cleaned Keywords */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                          Cleaned Keywords ({product.cleanedKeywords.length})
                        </h4>
                        <div className="rounded-lg border p-3 min-h-[100px]">
                          {product.cleanedKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.cleanedKeywords.map((keyword, i) => (
                                <Badge
                                  key={`clean-${index}-${i}`}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              No keywords remaining after deduplication.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </DataCard>
      )}
    </div>
  );
}
