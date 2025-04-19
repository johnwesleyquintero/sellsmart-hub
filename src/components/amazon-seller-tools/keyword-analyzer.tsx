// src/components/amazon-seller-tools/keyword-analyzer.tsx
'use client';

import { useToast } from '@/hooks/use-toast'; // Added for user feedback
import { exportToCSV } from '@/lib/amazon-tools/export-utils'; // Assuming this utility exists
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Search,
  Upload,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Local/UI Imports (Consistent with other tools)
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import DataCard from './DataCard'; // Use consistent DataCard
import SampleCsvButton from './sample-csv-button';

// --- Mock Keyword Intelligence (Placeholder - Replace with actual implementation) ---
interface KeywordIntelligence {
  analyzeBatch(
    keywords: string[],
  ): Promise<{ keyword: string; score: number }[]>;
}

const KeywordIntelligence: KeywordIntelligence = {
  async analyzeBatch(
    keywords: string[],
  ): Promise<{ keyword: string; score: number }[]> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    return keywords.map((keyword) => ({
      keyword,
      // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
      score: Math.floor(Math.random() * 100) + 1,
    }));
  },
};
// --- End Mock ---

// --- Types ---
type KeywordAnalysisResult = {
  keyword: string;
  score: number;
};

type KeywordData = {
  product: string;
  keywords: string[];
  searchVolume?: number;
  competition?: 'Low' | 'Medium' | 'High';
  analysis: KeywordAnalysisResult[];
  suggestions?: string[];
};

// Type for CSV row after parsing (flexible)
interface CsvInputRow {
  product?: string | null;
  keywords?: string | null; // Expect comma-separated string
  searchVolume?: string | number | null;
  competition?: string | null;
}

// --- Helper Function ---
async function processRow(
  item: CsvInputRow,
  rowIndex: number,
): Promise<KeywordData | null> {
  const productName = item.product?.trim();
  if (!productName) {
    console.warn(`Skipping row ${rowIndex + 1}: Missing product name.`);
    return null;
  }

  const keywords =
    item.keywords
      ?.split(',')
      .map((k) => k.trim().toLowerCase()) // Standardize keywords
      .filter(Boolean) || [];

  if (keywords.length === 0) {
    console.warn(
      `Skipping row ${rowIndex + 1} for product "${productName}": No valid keywords found.`,
    );
    return null;
  }

  try {
    const analysis = await KeywordIntelligence.analyzeBatch(keywords);

    const searchVolumeRaw = item.searchVolume;
    const searchVolume =
      searchVolumeRaw !== undefined &&
      searchVolumeRaw !== null &&
      searchVolumeRaw !== '' &&
      !isNaN(Number(searchVolumeRaw))
        ? Number(searchVolumeRaw)
        : undefined;

    const competitionRaw = item.competition?.trim().toLowerCase();
    const competition =
      competitionRaw === 'low' ||
      competitionRaw === 'medium' ||
      competitionRaw === 'high'
        ? ((competitionRaw.charAt(0).toUpperCase() +
            competitionRaw.slice(1)) as 'Low' | 'Medium' | 'High')
        : undefined;

    return {
      product: productName,
      keywords,
      searchVolume,
      competition,
      analysis,
      // Example suggestion logic (can be customized)
      suggestions: analysis.filter((a) => a.score > 70).map((a) => a.keyword),
    };
  } catch (analysisError) {
    console.error(
      `Error analyzing keywords for product "${productName}" (Row ${rowIndex + 1}):`,
      analysisError,
    );
    // Optionally return partial data or null based on requirements
    return null; // Skip row on analysis error
  }
}

// --- Component ---
export default function KeywordAnalyzer() {
  const { toast } = useToast();
  const [products, setProducts] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKeywords, setManualKeywords] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
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
        complete: async (result) => {
          try {
            if (result.errors.length > 0) {
              throw new Error(
                `CSV parsing error: ${result.errors[0].message}. Check row ${result.errors[0].row}.`,
              );
            }

            const requiredHeaders = ['product', 'keywords'];
            const actualHeaders =
              result.meta.fields?.map((h) => h.toLowerCase()) || []; // Case-insensitive check
            const missingHeaders = requiredHeaders.filter(
              (header) => !actualHeaders.includes(header),
            );

            if (missingHeaders.length > 0) {
              throw new Error(
                `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${actualHeaders.join(', ') || 'None'}`,
              );
            }

            if (result.data.length === 0) {
              throw new Error(
                'The uploaded CSV file appears to be empty or contains no data rows.',
              );
            }

            // Process rows concurrently
            const processedDataPromises = result.data.map((row, index) =>
              processRow(row, index),
            );
            const processedData = await Promise.all(processedDataPromises);

            const finalData = processedData.filter(
              (item): item is KeywordData => item !== null,
            );

            if (finalData.length === 0) {
              if (result.data.length > 0) {
                throw new Error(
                  "No valid product/keyword data found in the CSV after processing. Ensure 'product' and 'keywords' columns are present and populated.",
                );
              } else {
                // This case is already handled above, but kept for robustness
                throw new Error('CSV contains no processable data.');
              }
            }

            setProducts(finalData);
            setError(null); // Clear previous non-critical errors (like skipped rows info)
            toast({
              title: 'CSV Processed',
              description: `Successfully analyzed keywords for ${finalData.length} products.`,
              variant: 'default',
            });
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'An unknown error occurred during processing.';
            setError(message);
            setProducts([]); // Clear partial data on error
            toast({
              title: 'Processing Failed',
              description: message,
              variant: 'destructive',
            });
          } finally {
            setIsLoading(false);
            // Reset file input
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

  const handleManualAnalysis = useCallback(async () => {
    const trimmedKeywords = manualKeywords.trim();
    if (!trimmedKeywords) {
      const msg = 'Please enter keywords to analyze.';
      setError(msg);
      toast({
        title: 'Input Required',
        description: msg,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keywords = trimmedKeywords
        .split(',')
        .map((k) => k.trim().toLowerCase()) // Standardize
        .filter(Boolean);

      if (keywords.length === 0) {
        throw new Error('No valid keywords entered after trimming.');
      }

      const analysis = await KeywordIntelligence.analyzeBatch(keywords);

      const newProduct: KeywordData = {
        product: `Manual Analysis (${new Date().toLocaleTimeString()})`, // More unique name
        keywords,
        analysis,
        suggestions: analysis.filter((a) => a.score > 70).map((a) => a.keyword),
      };

      // Avoid adding exact duplicates of manual analysis if needed (optional)
      // const exists = products.some(p => p.product.startsWith('Manual Analysis') && p.keywords.join(',') === keywords.join(','));
      // if (exists) {
      //   toast({ title: 'Duplicate Analysis', description: 'These keywords were already analyzed manually.', variant: 'default' });
      // } else {
      //   setProducts((prev) => [...prev, newProduct]);
      // }

      setProducts((prev) => [...prev, newProduct]);
      setManualKeywords(''); // Clear input
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${keywords.length} manually entered keywords.`,
        variant: 'default',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze keywords: ${message}`);
      toast({
        title: 'Analysis Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [manualKeywords, toast]); // Added toast dependency

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

    const exportData = products.flatMap((product) =>
      product.analysis.map((analysisItem) => ({
        Product: product.product,
        Keyword: analysisItem.keyword,
        Score: analysisItem.score,
        Search_Volume: product.searchVolume ?? '',
        Competition: product.competition ?? '',
        // Optionally include the full list of original keywords for context
        // Original_Keywords: product.keywords.join('; '),
      })),
    );

    try {
      // Assuming exportToCSV handles the actual download
      exportToCSV(exportData, 'keyword-analysis.csv');
      toast({
        title: 'Export Successful',
        description: 'Keyword analysis exported to CSV.',
        variant: 'default',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to export data: ${message}`);
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [products, toast]); // Added toast dependency

  const clearData = useCallback(() => {
    setProducts([]);
    setError(null);
    setManualKeywords('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All analysis results have been removed.',
      variant: 'default',
    });
  }, [toast]); // Added toast dependency

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
              columns. Optional: `searchVolume`, `competition`.
            </li>
            <li>
              Or, manually enter comma-separated keywords for quick analysis.
            </li>
            <li>
              The tool analyzes each keyword (using a mock scoring system for
              demo).
            </li>
            <li>
              View keyword scores visually and identify potentially strong
              keywords (suggestions).
            </li>
            <li>Export the detailed analysis results to a CSV file.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <DataCard>
          <CardContent className="p-6">
            {' '}
            {/* Explicit padding control */}
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload Keywords CSV</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bulk analyze keywords from a CSV file
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
                    dataType="keyword" // Or a more specific type if available
                    fileName="sample-keyword-analyzer.csv"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </DataCard>

        {/* Manual Analysis Card */}
        <DataCard>
          <CardContent className="p-6">
            {' '}
            {/* Explicit padding control */}
            <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
              Manual Keyword Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="manual-keywords"
                  className="text-sm font-medium"
                >
                  Keywords*
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="manual-keywords"
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                    placeholder="Enter keywords, comma-separated"
                    className="flex-grow"
                    disabled={isLoading}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualKeywords(e.target.value)}
                  />
                  <Button
                    onClick={handleManualAnalysis}
                    disabled={isLoading || !manualKeywords.trim()}
                    className="flex-shrink-0 w-full sm:w-auto" // Prevent button shrinking too much
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Analyze
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Separate multiple keywords with commas.
                </p>
              </div>
            </div>
          </CardContent>
        </DataCard>
      </div>

      {/* Action Buttons (Export/Clear) */}
      {products.length > 0 && !isLoading && (
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Analysis
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
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />
          <p className="text-sm text-muted-foreground">Analyzing keywords...</p>
        </div>
      )}

      {/* Results Section */}
      {products.length > 0 && !isLoading && (
        <DataCard>
          {' '}
          {/* Wrap all results */}
          <CardContent className="p-4 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-3">
              Analysis Results ({products.length} Products/Entries)
            </h2>
            <div className="space-y-4">
              {products.map((product, index) => (
                <Card key={`${product.product}-${index}`}>
                  {' '}
                  {/* Unique key */}
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                      <h3 className="text-lg font-medium break-all">
                        {product.product}
                      </h3>
                      {(product.searchVolume || product.competition) && (
                        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                          {product.searchVolume !== undefined && ( // Check for undefined specifically
                            <>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                Search Vol:
                              </span>
                              <Badge variant="outline">
                                {product.searchVolume.toLocaleString()}
                              </Badge>
                            </>
                          )}
                          {product.competition && (
                            <>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                Competition:
                              </span>
                              <Badge
                                variant={getCompetitionVariant(product.competition)}
                              
                              >
                                {product.competition}
                              </Badge>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Keywords & Analysis Section */}
                    <div className="space-y-4">
                      {/* Original Keywords List */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                          Original Keywords ({product.keywords.length})
                        </h4>
                        <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-3 min-h-[50px]">
                          {product.keywords.length > 0 ? (
                            product.keywords.map((keyword, i) => (
                              <Badge
                                key={`orig-${index}-${i}`}
                                variant="outline"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              No keywords provided.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Keyword Analysis Chart */}
                      {product.analysis && product.analysis.length > 0 ? (
                        <div className="h-80 w-full">
                          {' '}
                          {/* Fixed height container */}
                          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                            Keyword Analysis Scores
                          </h4>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={product.analysis}
                              margin={{
                                top: 5,
                                right: 5,
                                left: -10,
                                bottom: 50,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="keyword"
                                tick={{ fontSize: 10 }}
                                angle={-40}
                                textAnchor="end"
                                height={60}
                                interval={0}
                              />
                              <YAxis
                                tick={{ fontSize: 10 }}
                                domain={[0, 100]}
                              />
                              <Tooltip
                                contentStyle={{
                                  fontSize: '12px',
                                  padding: '5px 10px',
                                }}
                                formatter={(value: number) => [
                                  `${value.toFixed(0)}`, // Simplified display
                                  'Score',
                                ]}
                                labelFormatter={(label: string) =>
                                  `Keyword: ${label}`
                                }
                              />
                              <Legend
                                wrapperStyle={{
                                  fontSize: '12px',
                                  paddingTop: '10px',
                                }}
                              />
                              <Bar
                                dataKey="score"
                                name="Analysis Score"
                                fill="hsl(var(--primary))" // Use theme primary color
                                radius={[4, 4, 0, 0]}
                                maxBarSize={50}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                            Keyword Analysis Scores
                          </h4>
                          <p className="text-sm text-muted-foreground italic">
                            No analysis data available.
                          </p>
                        </div>
                      )}

                      {/* Suggestions (Optional) */}
                      {product.suggestions &&
                        product.suggestions.length > 0 && (
                          <div className="pt-4 border-t border-dashed">
                            <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                              Suggested Keywords (Score &gt; 70)
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {product.suggestions.map((keyword, i) => (
                                <Badge
                                  key={`sugg-${index}-${i}`}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
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
