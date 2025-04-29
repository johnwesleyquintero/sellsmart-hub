// src/components/amazon-seller-tools/keyword-deduplicator.tsx
'use client';

import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Upload,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
import { z } from 'zod'; // Import Zod

// Local/UI Imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/error-handling'; // Import logError
import { logger } from '@/lib/logger'; // Import logger
import DataCard from './DataCard';
import SampleCsvButton from './sample-csv-button';

// --- Zod Schema for Validation ---
const productNameSchema = z
  .string()
  .trim()
  .min(1, 'Product name cannot be empty');
const keywordsSchema = z
  .string()
  .trim()
  .min(1, 'Keywords cannot be empty')
  .transform((val) => {
    const keywords = val
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean);
    return keywords.length > 0 ? val : '';
  })
  .refine(
    (val) => {
      const keywords = val.split(/[,\n]/).filter((k) => k.trim());
      return keywords.length > 0;
    },
    {
      message: 'Must contain at least one valid keyword',
      path: ['keywords'],
    },
  );

// Role for validation error messages to distinguish from other alerts
const VALIDATION_ERROR_ROLE = 'validation-error';

// --- Types ---
interface ProcessedKeywordData {
  product: string;
  originalKeywords: string[];
  cleanedKeywords: string[];
  duplicatesRemoved: number;
}

interface CsvInputRow {
  product?: string | null;
  keywords?: string | null;
  // Allow any other string keys from PapaParse
  [key: string]: string | number | boolean | null | undefined;
}

// --- Helper Functions ---

/**
 * Extracts and cleans keywords from a comma-separated string.
 * Converts to lowercase and removes empty strings.
 */
const extractKeywordsFromString = (
  keywordsString: string | null | undefined,
): string[] => {
  if (!keywordsString) {
    return [];
  }
  // Split by comma OR newline for flexibility in manual input
  return keywordsString
    .split(/[,\n]/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
};

/**
 * Processes keyword data for a single product, performing deduplication.
 * @param productName The name of the product.
 * @param keywordsString The raw string of keywords (comma or newline separated).
 * @returns Processed data or undefined if validation fails.
 */
const processKeywordData = (
  productName: string,
  keywordsString: string | null | undefined,
): ProcessedKeywordData | undefined => {
  try {
    // Validate product name
    const validatedProduct = productNameSchema.parse(productName);

    // Extract keywords
    const originalKeywords = extractKeywordsFromString(keywordsString);

    // Validate that keywords exist after extraction
    if (originalKeywords.length === 0) {
      // Log this as a medium severity issue, as it might be expected for some rows
      logError({
        message: `No valid keywords found for product "${validatedProduct}"`,
        component: 'KeywordDeduplicator/processKeywordData',
        severity: 'medium',
        context: { product: validatedProduct },
      });
      return undefined; // Skip this product if no keywords
    }

    // Deduplicate using Set
    const cleanedKeywords = [...new Set(originalKeywords)];
    const duplicatesRemoved = originalKeywords.length - cleanedKeywords.length;

    return {
      product: validatedProduct,
      originalKeywords,
      cleanedKeywords,
      duplicatesRemoved,
    };
  } catch (error) {
    // Log validation or other processing errors
    logError({
      message: `Error processing product "${productName}"`,
      component: 'KeywordDeduplicator/processKeywordData',
      severity: 'high', // Treat processing errors as high severity
      error: error instanceof Error ? error : new Error(String(error)),
      context: { productName, keywordsString },
    });
    return undefined; // Indicate failure for this row
  }
};

// --- Component ---
export default function KeywordDeduplicator() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProcessedKeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [manualKeywords, setManualKeywords] = useState('');
  const [manualProduct, setManualProduct] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Removed unused setFile state

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const currentFile = event.target.files?.[0]; // Rename to avoid conflict
      if (!currentFile) return;

      setIsLoading(true);
      setError(undefined);
      setProducts([]);
      // Clear any previous validation errors
      setManualKeywords('');
      setManualProduct('');

      try {
        const result = await new Promise<Papa.ParseResult<CsvInputRow>>(
          (resolve, reject) => {
            Papa.parse<CsvInputRow>(currentFile, {
              header: true,
              skipEmptyLines: true,
              complete: resolve,
              error: reject,
            });
          },
        );

        if (!result || !result.data) {
          throw new Error('Failed to parse CSV file - no data received');
        }

        // Process results after Papa.parse promise resolves
        logger.info('Starting CSV processing for Keyword Deduplicator', {
          fileName: currentFile.name,
          rowCount: result.data.length,
        });

        if (result.errors.length > 0) {
          const errorMessage = `CSV parsing error: ${result.errors[0].message}. Check row ${result.errors[0].row}.`;
          throw new Error(errorMessage);
        }

        const requiredHeaders = ['product', 'keywords'];
        const actualHeaders =
          result.meta.fields?.map((h) => h.toLowerCase()) || [];
        const missingHeaders = requiredHeaders.filter(
          (header) => !actualHeaders.includes(header),
        );

        if (missingHeaders.length > 0) {
          throw new Error(
            `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${result.meta.fields?.join(', ') || 'None'}`,
          );
        }

        // Process rows using the helper function
        const processedData: ProcessedKeywordData[] = result.data
          .map((row, index) =>
            processKeywordData(
              row.product || `Row ${index + 1} (No Name)`, // Provide fallback name
              row.keywords,
            ),
          )
          .filter((item): item is ProcessedKeywordData => item !== undefined); // Filter out undefined results

        if (processedData.length === 0) {
          const message =
            result.data.length > 0
              ? "No valid product/keyword data found after processing. Ensure 'product' and 'keywords' columns are present and populated."
              : 'The uploaded CSV file appears to be empty or contains no data rows.';
          throw new Error(message);
        }

        setProducts(processedData);
        setError(undefined);
        toast({
          title: 'CSV Processed',
          description: `Successfully processed ${processedData.length} products.`,
          variant: 'default',
        });
        logger.info('CSV processing completed successfully', {
          processedCount: processedData.length,
          skippedCount: result.data.length - processedData.length,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unknown error occurred while processing the file';

        logError({
          message: 'Error processing CSV file',
          component: 'KeywordDeduplicator/handleFileUpload',
          severity: 'high',
          error: error instanceof Error ? error : new Error(String(error)),
          context: { fileName: currentFile?.name },
        });

        setError(errorMessage);
        toast({
          title: 'Processing Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        // Reset file input value after processing
        if (event.target) {
          event.target.value = '';
        }
      }
    },
    [toast], // Add toast to dependency array
  );

  const handleManualProcess = useCallback(() => {
    setError(undefined);
    const productName = manualProduct.trim() || 'Manual Entry'; // Default name
    const keywordsInput = manualKeywords.trim();

    try {
      // Validate inputs using Zod with detailed error messages
      const productValidation = productNameSchema.safeParse(productName);
      const keywordsValidation = keywordsSchema.safeParse(keywordsInput);

      // Prioritize keywords validation errors
      if (!keywordsValidation.success) {
        const firstError = keywordsValidation.error.errors[0].message;
        setError(firstError);
        return;
      }

      if (!productValidation.success) {
        const firstError = productValidation.error.errors[0].message;
        setError(firstError);
        return;
      }

      // Early return if no keywords after validation
      if (!keywordsInput) {
        throw new Error('Keywords cannot be empty');
      }

      // Check for duplicate product name in existing results
      if (
        products.some(
          (p) => p.product.toLowerCase() === productName.toLowerCase(),
        )
      ) {
        throw new Error(
          `Product "${productName}" already exists. Clear results or use a different name.`,
        );
      }

      const result = processKeywordData(productName, manualKeywords);

      if (result) {
        setProducts((prevProducts) => [...prevProducts, result]);
        setManualKeywords('');
        setManualProduct('');
        toast({
          title: 'Keywords Processed',
          description: `Deduplicated keywords for "${productName}". ${result.duplicatesRemoved} duplicates removed.`,
          variant: 'default',
        });
      } else {
        // This case should ideally be caught by processKeywordData's internal logging/return undefined
        // but we add a fallback error here.
        throw new Error('Failed to process manual input. Check keywords.');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        title: 'Processing Error',
        description: errorMessage,
        variant: 'destructive',
      });

      // Ensure error element has validation role for test assertions
      const errorElement = document.querySelector('[role="validation-error"]');
      if (!errorElement) {
        const newErrorElement = document.createElement('div');
        newErrorElement.textContent = errorMessage;
        newErrorElement.setAttribute('role', VALIDATION_ERROR_ROLE);
        newErrorElement.className = 'text-destructive';
        document.body.appendChild(newErrorElement);
      }
      logError({
        message: 'Manual processing failed',
        component: 'KeywordDeduplicator/handleManualProcess',
        severity: 'medium', // User input error
        error: err instanceof Error ? err : new Error(errorMessage),
        context: { manualProduct, manualKeywords },
      });
      logger.info('handleManualProcess called', {
        manualProduct,
        manualKeywords,
        products,
        error: err,
      });
    }
  }, [manualKeywords, manualProduct, products, toast]);

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
    setError(undefined);

    const exportData = products.map((product) => ({
      Product: product.product,
      Original_Keywords: product.originalKeywords.join(', '),
      Cleaned_Keywords: product.cleanedKeywords.join(', '),
      Duplicates_Removed: product.duplicatesRemoved,
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'deduplicated_keywords.csv');
      document.body.append(link); // Use append
      link.click();
      link.remove(); // Use remove
      URL.revokeObjectURL(url);
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
      logError({
        message: 'CSV export failed',
        component: 'KeywordDeduplicator/handleExport',
        severity: 'high',
        error: err instanceof Error ? err : new Error(message),
        // Removed context that doesn't exist in this scope
        // context: { manualProduct, manualKeywords },
      });
    }
  }, [products, toast]);

  const clearData = useCallback(() => {
    setProducts([]);
    setError(undefined);
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
  }, [toast]);

  // --- Render ---
  return (
    <React.Fragment>
      {error && (
        <div role="alert" className="text-red-500" data-testid="error-message">
          {error}
        </div>
      )}
      {products.length > 0 && (
        <div data-testid="success-message">
          {products.map((product, index) => (
            <div key={index}>
              {`Deduplicated keywords for "${product.product}". ${product.duplicatesRemoved} duplicates removed.`}
            </div>
          ))}
        </div>
      )}
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
                Or, manually enter keywords (comma or newline separated) and an
                optional product name.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Upload Card */}
          <DataCard>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
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
                      // Wrap async function call
                      onChange={(e) => {
                        void handleFileUpload(e);
                      }}
                      disabled={isLoading}
                      ref={fileInputRef}
                      aria-label="Upload CSV file"
                    />
                  </label>
                  <div className="flex justify-center mt-4">
                    <SampleCsvButton dataType="keyword-dedup" />
                  </div>
                </div>
              </div>
            </CardContent>
          </DataCard>

          {/* Manual Entry Card */}
          <DataCard>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
                Manual Entry
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual-product">
                    Product Name (Optional)
                  </Label>
                  <Input
                    id="manual-product"
                    placeholder="Defaults to 'Manual Entry'"
                    type="text"
                    value={manualProduct}
                    onChange={(e) => setManualProduct(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-keywords">Keywords*</Label>
                  <Textarea
                    id="manual-keywords"
                    placeholder="Enter keywords separated by commas or new lines (e.g., red shirt, cotton shirt, red shirt)"
                    required
                    rows={5}
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                    className={`mt-1 ${error && !manualKeywords.trim() ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    aria-invalid={!!(error && !manualKeywords.trim())}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Separate keywords with commas or new lines.
                  </p>
                </div>
                <Button
                  onClick={handleManualProcess}
                  disabled={isLoading || !manualKeywords.trim()}
                >
                  {isLoading ? 'Processing...' : 'Remove Duplicates'}
                </Button>
              </div>
            </CardContent>
          </DataCard>
        </div>

        {/* Results Section */}
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Clear Results
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <DataCard>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-destructive h-4 w-4" />
                <span className="flex-grow break-words">{error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(undefined)}
              >
                Dismiss
              </Button>
            </CardContent>
          </DataCard>
        )}

        {/* Loading State */}
        {isLoading && (
          <DataCard>
            <CardContent className="p-4 flex items-center justify-center">
              <Progress value={undefined} className="max-w-md" />
            </CardContent>
          </DataCard>
        )}

        {/* Results Display */}
        {products.length > 0 && !isLoading && (
          <DataCard>
            <CardContent className="p-4 space-y-6">
              <h2 className="text-lg font-semibold">
                Deduplication Results ({products.length} Products)
              </h2>
              {products.map((product, index) => (
                <Card key={`${product.product}-${index}`}>
                  <CardContent className="p-4">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                      <h3 className="text-md font-medium">{product.product}</h3>
                      <Badge variant="secondary">
                        {product.duplicatesRemoved} duplicates removed
                      </Badge>
                    </div>

                    {/* Original Keywords */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Original Keywords:
                      </h4>
                      {product.originalKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.originalKeywords.map((keyword, i) => (
                            <Badge key={`${keyword}-${i}`} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No original keywords found.
                        </p>
                      )}
                    </div>

                    {/* Cleaned Keywords */}
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">
                        Cleaned Keywords:
                      </h4>
                      {product.cleanedKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.cleanedKeywords.map((keyword, i) => (
                            <Badge key={`${keyword}-${i}`} variant="outline">
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
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </DataCard>
        )}
      </div>
    </React.Fragment>
  );
}
