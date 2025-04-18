// src/components/amazon-seller-tools/keyword-analyzer.tsx
'use client';

import { exportToCSV } from '@/lib/amazon-tools/export-utils';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react'; // Added useCallback, useRef
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

// UI Imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Added Input
import { Label } from '@/components/ui/label'; // Added Label
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  Download,
  FileText,
  Search,
  Upload,
  XCircle, // Import XCircle for the error dismiss button
} from 'lucide-react';
import SampleCsvButton from './sample-csv-button'; // Assuming this exists and works

// --- Mock Keyword Intelligence (Replace with actual implementation) ---
interface KeywordIntelligence {
  analyzeBatch(
    keywords: string[],
  ): Promise<{ keyword: string; score: number }[]>;
}

// Simple mock for demonstration
const KeywordIntelligence: KeywordIntelligence = {
  async analyzeBatch(
    keywords: string[],
  ): Promise<{ keyword: string; score: number }[]> {
    // Simulate API response delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate scores
    return keywords.map((keyword) => ({
      keyword,
      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      score: Math.floor(Math.random() * 100) + 1, // Score between 1 and 100
    }));
  },
};

// --- Types ---
type KeywordAnalysisResult = {
  keyword: string;
  score: number;
};

type KeywordData = {
  product: string;
  keywords: string[];
  searchVolume?: number; // Optional: Keep if CSV might contain it
  competition?: 'Low' | 'Medium' | 'High'; // Optional: Keep if CSV might contain it
  analysis: KeywordAnalysisResult[]; // Changed from optional, analysis is core
  suggestions?: string[]; // Optional: Derived from analysis or separate source
};

// --- Helper Function ---
async function processRow(item: {
  product: string;
  keywords: string | string[];
  searchVolume?: string | number;
  competition?: string;
}): Promise<KeywordData | null> {
  const keywords = (() => {
    if (typeof item.keywords === 'string') {
      return item.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    } else if (Array.isArray(item.keywords)) {
      return item.keywords.map(String).filter(Boolean);
    } else {
      return [];
    }
  })();

  if (keywords.length === 0) {
    console.warn(
      `Skipping row for product "${item.product}" due to missing keywords.`,
    );
    return null;
  }

  const analysis = await KeywordIntelligence.analyzeBatch(keywords);

  const searchVolumeRaw = item.searchVolume;
  const searchVolume =
    searchVolumeRaw !== undefined &&
    searchVolumeRaw !== '' &&
    !isNaN(Number(searchVolumeRaw))
      ? Number(searchVolumeRaw)
      : undefined;

  const competitionRaw = item.competition?.trim().toLowerCase();
  const competition =
    competitionRaw === 'low' ||
    competitionRaw === 'medium' ||
    competitionRaw === 'high'
      ? ((competitionRaw.charAt(0).toUpperCase() + competitionRaw.slice(1)) as
          | 'Low'
          | 'Medium'
          | 'High')
      : undefined;

  return {
    product: String(item.product),
    keywords,
    searchVolume,
    competition,
    analysis,
    suggestions: analysis.filter((a) => a.score > 50).map((a) => a.keyword),
  };
}

// --- Component ---
export default function KeywordAnalyzer() {
  const [products, setProducts] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKeywords, setManualKeywords] = useState(''); // Renamed from searchTerm
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setProducts([]); // Clear previous results on new upload

      Papa.parse<{
        product: string;
        keywords: string | string[];
        searchVolume?: string | number;
        competition?: string;
      }>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
          if (result.errors.length > 0) {
            setError(
              `Error parsing CSV file: ${result.errors[0].message}. Please check the format. Required columns: product, keywords.`,
            );
            setIsLoading(false);
            return;
          }

          // Validate required headers
          const requiredHeaders = ['product', 'keywords'];
          const actualHeaders = result.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(
            (header) => !actualHeaders.includes(header),
          );

          if (missingHeaders.length > 0) {
            setError(
              `Missing required columns in CSV: ${missingHeaders.join(', ')}.`,
            );
            setIsLoading(false);
            return;
          }

          try {
            const validRows = result.data.filter(
              (item) => item.product && item.keywords,
            );

            if (validRows.length === 0) {
              throw new Error(
                'No valid rows found in CSV. Ensure product and keywords columns are present and populated.',
              );
            }

            // Process rows concurrently
            const processedDataPromises = validRows.map(processRow);
            const processedData = await Promise.all(processedDataPromises);

            const finalData = processedData.filter(
              (item): item is KeywordData => item !== null,
            );

            if (finalData.length === 0) {
              throw new Error(
                'No processable keyword data found after validation.',
              );
            }

            setProducts(finalData);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : 'An unknown error occurred during processing.';
            setError(`Failed to process CSV data: ${message}`);
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
        },
      });
    },
    [], // No dependencies
  );

  const handleManualAnalysis = useCallback(async () => {
    if (!manualKeywords.trim()) {
      setError('Please enter keywords to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keywords = manualKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      if (keywords.length === 0) {
        throw new Error('No valid keywords entered.');
      }

      const analysis = await KeywordIntelligence.analyzeBatch(keywords);

      const newProduct: KeywordData = {
        product: 'Manual Analysis', // Use a generic name
        keywords,
        analysis,
        suggestions: analysis.filter((a) => a.score > 50).map((a) => a.keyword), // Example suggestion logic
        // Optional: Add mock searchVolume/competition if desired for manual entry
        // searchVolume: Math.floor(Math.random() * 10000),
        // competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
      };

      setProducts((prev) => [...prev, newProduct]);
      setManualKeywords(''); // Clear input after successful analysis
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze keywords: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [manualKeywords]); // Depends on manualKeywords

  const handleExport = useCallback(() => {
    if (products.length === 0) {
      setError('No data to export.');
      return;
    }
    setError(null);

    // Flatten analysis data for export
    const exportData = products.flatMap((product) =>
      product.analysis.map((analysisItem) => ({
        product: product.product,
        keyword: analysisItem.keyword,
        score: analysisItem.score,
        original_keywords_list: product.keywords.join('; '), // Include original list if needed
        searchVolume: product.searchVolume ?? '', // Use ?? for undefined/null
        competition: product.competition ?? '',
      })),
    );

    try {
      exportToCSV(exportData, 'keyword-analysis.csv');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to export data: ${message}`);
    }
  }, [products]); // Depends on products

  const clearData = useCallback(() => {
    setProducts([]);
    setError(null);
    setManualKeywords('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []); // No dependencies

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* CSV Upload Card */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Upload CSV with product and keyword data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
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
                    dataType="keyword"
                    fileName="sample-keyword-analyzer.csv"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Analysis Card */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium text-center sm:text-left">
                Manual Keyword Analysis
              </h3>
              <div className="space-y-3">
                <div>
                  <Label
                    htmlFor="manual-keywords"
                    className="text-sm font-medium"
                  >
                    Keywords
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="manual-keywords"
                      value={manualKeywords}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setManualKeywords(e.target.value);
                      }}
                      placeholder="Enter keywords, comma-separated"
                      className="flex-grow"
                    />
                    <Button
                      onClick={handleManualAnalysis}
                      disabled={isLoading || !manualKeywords.trim()}
                      className="w-full sm:w-auto"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Analyze
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter one or more keywords separated by commas.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear Data Button (appears when data exists) */}
      {products.length > 0 && !isLoading && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={clearData} disabled={isLoading}>
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
            <XCircle className="h-4 w-4" /> {/* Changed Icon */}
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
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Analysis
            </Button>
          </div>
          {products.map((product, index) => {
            // Refactor the first nested ternary operation

            return (
              <Card key={`${product.product}-${index}`}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg font-medium break-all">
                      {product.product}
                    </h3>
                    {(product.searchVolume || product.competition) && (
                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                        {product.searchVolume && (
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
                              variant={(() => {
                                if (product.competition === 'High')
                                  return 'destructive';
                                if (product.competition === 'Medium')
                                  return 'secondary';
                                return 'default';
                              })()}
                            >
                              {product.competition}
                            </Badge>
                          </>
                        )}
                      </div>
                    )}
                  </div>{' '}
                  {/* End Header Div */}
                  {/* Keywords & Analysis Section */}
                  <div className="space-y-4">
                    {/* Analyzed Keywords List */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Analyzed Keywords ({product.keywords.length})
                      </h4>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {product.keywords.map((keyword, i) => (
                          <Badge
                            key={`orig-${i}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Keyword Analysis Chart */}
                    {product.analysis && product.analysis.length > 0 && (
                      <div className="h-80 w-full">
                        <h4 className="mb-2 text-sm font-medium">
                          Keyword Analysis Scores
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={product.analysis}
                            margin={{
                              top: 5,
                              right: 5,
                              left: -10, // Adjusted for better Y-axis label visibility
                              bottom: 50, // Increased bottom margin for angled labels
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="keyword"
                              tick={{ fontSize: 10 }}
                              angle={-40} // Angle labels
                              textAnchor="end" // Anchor angled labels correctly
                              height={60} // Allocate height for angled labels
                              interval={0} // Ensure all labels are shown
                            />
                            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                            <Tooltip
                              formatter={(value: number) => [
                                `${value.toFixed(0)} / 100`,
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
                              fill="var(--chart-primary, #8884d8)"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={50}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Suggestions (Optional) */}
                    {product.suggestions && product.suggestions.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="mb-2 text-sm font-medium">
                          Suggested Keywords (Score &gt; 50)
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {product.suggestions.map((keyword, i) => (
                            <Badge
                              key={`sugg-${i}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>{' '}
                  {/* End Keywords & Analysis Div */}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
