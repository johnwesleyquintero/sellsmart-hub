'use client'; // Ensure this is at the very top

import { useIsMobile } from '@/app/hooks/use-mobile';
import { Card, Input } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { sanitizeHtml } from '@/lib/sanitize';
import { Info } from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useEffect, useRef, useState } from 'react'; // Added React, useRef, useEffect
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

// --- Interfaces ---
interface CsvRow {
  asin: string;
  price: string;
  reviews: string;
  rating: number; // Assuming rating might come as number directly
  conversion_rate: string;
  click_through_rate: string;
  // Allow other potential columns
  [key: string]: string | number | undefined | null;
}

interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
  niche?: string; // Optional niche field
}

interface ChartDataPoint {
  name: string; // Corresponds to ASIN or Niche
  [key: string]: string | number; // Metrics as keys
}

type MetricType =
  | 'price'
  | 'reviews'
  | 'rating'
  | 'conversion_rate'
  | 'click_through_rate';

// --- Constants ---
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for sessionStorage

// --- Helper Functions (Outside Component) ---

export function validateAndProcessData(data: CsvRow[]): {
  validData: ProcessedRow[];
  errors: string[];
} {
  const validData: ProcessedRow[] = [];
  const errors: string[] = [];

  data.forEach((row, index) => {
    const {
      asin,
      price,
      reviews,
      rating,
      conversion_rate,
      click_through_rate,
    } = row;

    // Check for essential fields presence (allow 0 values)
    if (
      !asin ||
      price === undefined ||
      price === null ||
      price === '' ||
      reviews === undefined ||
      reviews === null ||
      reviews === '' ||
      rating === undefined ||
      rating === null ||
      conversion_rate === undefined ||
      conversion_rate === null ||
      conversion_rate === '' ||
      click_through_rate === undefined ||
      click_through_rate === null ||
      click_through_rate === ''
    ) {
      errors.push(`Row ${index + 1}: Missing required fields`);
      return;
    }

    // Parse numeric values carefully
    const parsedPrice = Number(String(price).replace(/[^0-9.-]+/g, '')); // Clean currency/commas
    const parsedReviews = Number(String(reviews).replace(/[^0-9]+/g, '')); // Clean commas, ensure integer
    const parsedRating = Number(rating); // Assume rating is already a number or easily convertible
    const parsedConversionRate = Number(
      String(conversion_rate).replace(/[^0-9.-]+/g, ''),
    ); // Clean percentage signs etc.
    const parsedClickThroughRate = Number(
      String(click_through_rate).replace(/[^0-9.-]+/g, ''),
    ); // Clean percentage signs etc.

    // Validate numeric results
    if (
      isNaN(parsedPrice) ||
      isNaN(parsedReviews) ||
      !Number.isInteger(parsedReviews) ||
      parsedReviews < 0 ||
      isNaN(parsedRating) ||
      parsedRating < 0 ||
      parsedRating > 5 || // Basic rating validation
      isNaN(parsedConversionRate) ||
      parsedConversionRate < 0 ||
      isNaN(parsedClickThroughRate) ||
      parsedClickThroughRate < 0
    ) {
      errors.push(`Row ${index + 1}: Invalid numeric values`);
      return;
    }

    validData.push({
      asin: String(asin).trim(),
      price: parsedPrice,
      reviews: parsedReviews,
      rating: parsedRating,
      conversion_rate: parsedConversionRate,
      click_through_rate: parsedClickThroughRate,
    });
  });

  return { validData, errors };
}

const getChartColor = (metric: MetricType): string => {
  const colors: Record<MetricType, string> = {
    price: '#2563eb', // blue-600
    reviews: '#16a34a', // green-600
    rating: '#eab308', // yellow-600
    conversion_rate: '#dc2626', // red-600
    click_through_rate: '#9333ea', // purple-600
  };
  return colors[metric];
};

// --- Component ---
interface CompetitorAnalyzerProps {
  onAnalyzeAction: (data: ProcessedRow[]) => void;
}
export function CompetitorAnalyzer({
  onAnalyzeAction,
}: CompetitorAnalyzerProps) {
  const [asin, setAsin] = useState('');
  const [metrics, setMetrics] = useState<MetricType[]>([
    'price',
    'reviews',
    'rating',
  ]);
  const [isLoading, setIsLoading] = useState(false);
  // Use null as initial state for clarity when no file is uploaded yet
  const [, setSellerData] = useState<ProcessedRow[] | null>(null);
  const [competitorData, setCompetitorData] = useState<ProcessedRow[] | null>(
    null,
  );
  const [chartData, setChartData] = useState<ChartDataPoint[] | undefined>(
    undefined,
  );
  const isMobile = useIsMobile();
  const sellerFileInputRef = useRef<HTMLInputElement>(null); // Ref for seller file input
  const competitorFileInputRef = useRef<HTMLInputElement>(null); // Ref for competitor file input

  // Load chart data from session storage on mount
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('chartData');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Basic validation of stored data structure
        if (
          Array.isArray(parsedData) &&
          parsedData.every((item) => typeof item === 'object' && item !== null)
        ) {
          setChartData(parsedData as ChartDataPoint[]);
          logger.info('Loaded chart data from sessionStorage');
        } else {
          logger.warn('Invalid chart data found in sessionStorage, ignoring.');
          sessionStorage.removeItem('chartData');
        }
      }
    } catch (error) {
      logger.error('Failed to load or parse data from sessionStorage', {
        error,
      });
      sessionStorage.removeItem('chartData'); // Clear invalid data
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Moved Functions Inside Component ---

  const processCsvData = useCallback((): void => {
    // This function now primarily formats data for the chart if CSV data exists
    try {
      // Use competitorData if available, otherwise don't proceed with CSV processing for chart
      if (!competitorData || competitorData.length === 0) {
        logger.info(
          'processCsvData: No competitor CSV data available to format for chart.',
        );
        // If there's an ASIN, let the API call handle it later
        if (!asin) {
          setIsLoading(false); // Stop loading if there's nothing to process
          toast({
            title: 'Missing Data',
            description: 'Please upload competitor data or enter an ASIN.',
            variant: 'destructive',
          });
        }
        return; // Exit if no competitor CSV data
      }

      const formattedData = competitorData.map((row) => {
        // Use ASIN if available, fallback to niche, then 'N/A'
        const competitorName = sanitizeHtml(
          row.asin || row.niche || `Competitor_${row.asin}`,
        );
        const dataPoint: ChartDataPoint = {
          name: competitorName,
        };

        metrics.forEach((metric: MetricType) => {
          const value = row[metric]; // Access metric directly
          // Ensure value is a valid number before adding
          if (value !== undefined && !isNaN(Number(value))) {
            dataPoint[metric] = Number(value);
          } else {
            dataPoint[metric] = 0; // Default to 0 if invalid or missing
          }
        });

        return dataPoint;
      });

      if (formattedData.length > 0 && metrics.length > 0) {
        // Check storage size before saving
        try {
          const dataString = JSON.stringify(formattedData);
          const dataSize = new Blob([dataString]).size;
          if (dataSize <= MAX_STORAGE_SIZE) {
            sessionStorage.setItem('chartData', dataString);
            logger.info('Saved chart data to sessionStorage');
          } else {
            sessionStorage.removeItem('chartData'); // Clear if too large
            logger.warn(
              'Chart data exceeds storage limit, not saved to sessionStorage',
            );
            toast({
              title: 'Warning',
              description:
                'Generated data is too large to save in session storage.',
              variant: 'default',
            });
          }
        } catch (storageError) {
          logger.error('Failed to save data to sessionStorage', {
            error: storageError,
          });
          toast({
            title: 'Storage Error',
            description: 'Could not save analysis data.',
            variant: 'destructive',
          });
        }
        setChartData(formattedData);
      } else {
        // This case might happen if metrics array is empty or data processing failed unexpectedly
        setChartData(undefined);
        logger.warn(
          'processCsvData: No chart data generated after processing CSV.',
        );
        toast({
          title: 'Processing Issue',
          description: 'Could not generate chart data from the CSV.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error processing CSV data for chart:', { error });
      toast({
        title: 'Error',
        description: 'Failed to process CSV data for the chart.',
        variant: 'destructive',
      });
      setChartData(undefined); // Clear chart on error
    } finally {
      // setIsLoading(false); // Loading state should be managed by the caller (analyzeCompetitor)
    }
  }, [metrics, competitorData, asin, setIsLoading]); // Added asin, setIsLoading

  const handleFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      // Explicitly type setData for better type safety
      setData: React.Dispatch<React.SetStateAction<ProcessedRow[] | null>>,
    ) => {
      const file = event.target.files?.[0];
      const inputElement = event.target; // Store ref to input

      if (!file) {
        // Don't show error if user simply cancelled file selection
        // toast({ title: "Error", description: "No file selected", variant: "destructive" });
        return;
      }

      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: 'Invalid File Type',
          description: 'Only CSV files are supported.',
          variant: 'destructive',
        });
        if (inputElement) inputElement.value = ''; // Clear the input
        return;
      }

      setIsLoading(true); // Indicate loading during parse
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const csvData = e.target?.result as string;
          if (!csvData) {
            throw new Error('File content could not be read.');
          }

          Papa.parse<CsvRow>(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setIsLoading(false); // Parsing complete
              if (results.errors.length > 0) {
                // Handle PapaParse specific errors
                const parseErrorMsg = `CSV parsing error: ${results.errors[0].message} near row ${results.errors[0].row || 'unknown'}.`;
                logger.error('CSV parsing error:', { errors: results.errors });
                toast({
                  title: 'Parsing Error',
                  description: parseErrorMsg,
                  variant: 'destructive',
                });
                setData(null); // Clear data on parse error
                if (inputElement) inputElement.value = ''; // Clear the input
                return;
              }

              const { validData, errors: validationErrors } =
                validateAndProcessData(results.data);

              if (validationErrors.length > 0) {
                toast({
                  title: 'Validation Warning',
                  description: `Some rows had issues: ${validationErrors.slice(0, 2).join(', ')}${validationErrors.length > 2 ? '...' : ''}. Check console for details.`,
                  variant: 'default', // Use default variant for warnings
                });
                logger.warn('CSV validation errors:', { validationErrors });
              }

              if (validData.length === 0 && results.data.length > 0) {
                toast({
                  title: 'Processing Error',
                  description:
                    'No valid data rows found in the CSV. Please check file format and content.',
                  variant: 'destructive',
                });
                setData(null); // Clear data if no valid rows
              } else if (validData.length > 0) {
                setData(validData);
                toast({
                  title: 'Success',
                  description: `${file.name} processed successfully (${validData.length} valid rows).`,
                  variant: 'default',
                });
              } else {
                // Case: Empty file or only header row
                toast({
                  title: 'Empty File',
                  description: 'The uploaded CSV file appears to be empty.',
                  variant: 'default',
                });
                setData(null);
              }
              // Don't clear input here, let analyzeCompetitor handle it or add a clear button
            },
            error: (error: Error) => {
              setIsLoading(false);
              logger.error('CSV parsing error (PapaParse error callback):', {
                error,
              });
              toast({
                title: 'Parsing Error',
                description: `Failed to parse CSV file: ${error.message}`,
                variant: 'destructive',
              });
              setData(null); // Clear data on parse error
              if (inputElement) inputElement.value = ''; // Clear the input
            },
          });
        } catch (error) {
          setIsLoading(false);
          const message =
            error instanceof Error ? error.message : 'Unknown file error';
          logger.error('File processing error:', { error });
          toast({
            title: 'File Error',
            description: message,
            variant: 'destructive',
          });
          setData(null); // Clear data on error
          if (inputElement) inputElement.value = ''; // Clear the input
        }
      };
      reader.onerror = () => {
        setIsLoading(false);
        logger.error('FileReader error occurred.');
        toast({
          title: 'File Read Error',
          description: 'Could not read the selected file.',
          variant: 'destructive',
        });
        setData(null); // Clear data on read error
        if (inputElement) inputElement.value = ''; // Clear the input
      };
      reader.readAsText(file);
    },
    [setIsLoading], // Only depends on setIsLoading
  );

  const getApiErrorMessage = (status: number): string => {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input ASIN.';
      case 401:
        return 'Authentication required. Please log in.'; // Placeholder
      case 403:
        return 'Access denied. Please check your permissions.'; // Placeholder
      case 404:
        return 'Competitor data not found for the provided ASIN.';
      case 429:
        return 'API rate limit exceeded. Please try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error fetching data. Please try again later.';
      default:
        return `Failed to fetch competitor data (Status: ${status})`;
    }
  };

  const fetchAndProcessApiData = useCallback(async (): Promise<void> => {
    // Fetches data from API and updates chartData
    if (!asin) {
      toast({
        title: 'Missing ASIN',
        description: 'Please enter an ASIN to fetch data.',
        variant: 'destructive',
      });
      return; // Exit if no ASIN
    }

    try {
      const response = await fetch('/api/amazon/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send only necessary data for API call
        body: JSON.stringify({
          asin: sanitizeHtml(asin), // Sanitize ASIN before sending
          metrics, // Send selected metrics
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('API Error fetching competitor data:', {
          status: response.status,
          error: errorText,
          asin: asin,
        });
        throw new Error(getApiErrorMessage(response.status));
      }

      // Define expected API response structure
      interface ApiResponse {
        competitors: string[];
        metrics: Record<string, (number | null)[]>; // Allow nulls from API
      }

      let data: ApiResponse;
      try {
        data = await response.json();
        // Basic validation of the response structure
        if (
          !data ||
          !Array.isArray(data.competitors) ||
          typeof data.metrics !== 'object' ||
          data.metrics === null
        ) {
          throw new Error('Invalid response format from server');
        }
      } catch (parseError) {
        logger.error('API response parsing error:', { error: parseError });
        throw new Error('Failed to parse server response.');
      }

      // Format data for the chart
      const formattedData = data.competitors.map((competitor, index) => {
        const dataPoint: ChartDataPoint = {
          name: sanitizeHtml(competitor), // Sanitize competitor names
        };

        metrics.forEach((metric: MetricType) => {
          const metricValues = data.metrics[metric];
          const value =
            Array.isArray(metricValues) &&
            typeof metricValues[index] === 'number'
              ? metricValues[index]
              : 0; // Default to 0 if missing or not a number
          dataPoint[metric] = value as number;
        });

        return dataPoint;
      });

      if (formattedData.length === 0) {
        // This might mean the API returned competitors but no metric data, or no competitors
        logger.warn('API returned no processable competitor data.', { asin });
        toast({
          title: 'No Data',
          description: 'No competitor data found or processed for this ASIN.',
          variant: 'default',
        });
        setChartData(undefined); // Clear chart if no data
      } else {
        setChartData(formattedData);
        // Save to session storage (optional, consider size)
        try {
          const dataString = JSON.stringify(formattedData);
          const dataSize = new Blob([dataString]).size;
          if (dataSize <= MAX_STORAGE_SIZE) {
            sessionStorage.setItem('chartData', dataString);
          } else {
            logger.warn(
              'API data exceeds storage limit, not saved to sessionStorage',
            );
          }
        } catch (storageError) {
          logger.error('Failed to save API data to sessionStorage', {
            error: storageError,
          });
        }
      }
    } catch (error) {
      // Catch errors from fetch or processing
      const message =
        error instanceof Error ? error.message : 'Failed to fetch API data.';
      logger.error('Error in fetchAndProcessApiData:', { error, asin });
      toast({
        title: 'API Error',
        description: message,
        variant: 'destructive',
      });
      setChartData(undefined); // Clear chart on API error
      // Re-throw if needed, but usually just updating state/UI is enough
      // throw error;
    }
  }, [asin, metrics, setChartData]); // Dependencies

  const [requiredError, setRequiredError] = useState<string | null>(null);

  const validateData = useCallback((): boolean => {
    // Checks if there's enough data to proceed with analysis
    // const hasSellerCsv = sellerData && sellerData.length > 0;
    const hasCompetitorCsv = competitorData && competitorData.length > 0;
    const hasAsin = asin.trim() !== '';

    // Require either competitor CSV or an ASIN
    if (!hasCompetitorCsv && !hasAsin) {
      setRequiredError(
        'Please upload competitor data CSV or enter a competitor ASIN to analyze.',
      );
      toast({
        title: 'Missing Input',
        description:
          'Please upload competitor data CSV or enter a competitor ASIN to analyze.',
        variant: 'destructive',
      });
      return false;
    }

    setRequiredError(null);
    return true;
  }, [competitorData, asin]);

  const analyzeCompetitor = useCallback(async () => {
    // Main handler to trigger analysis
    if (!validateData()) {
      return;
    }

    setIsLoading(true);
    setChartData(undefined); // Clear previous chart results
    sessionStorage.removeItem('chartData'); // Clear stored data

    try {
      // Prioritize processing CSV data if it exists
      if (competitorData && competitorData.length > 0) {
        logger.info('Analyzing using uploaded Competitor CSV data.');
        processCsvData(); // This will update chartData and save to sessionStorage
        onAnalyzeAction(competitorData);
      }
      // If no competitor CSV, but ASIN exists, fetch from API
      else if (asin.trim()) {
        logger.info(`Analyzing using ASIN: ${asin}`);
        await fetchAndProcessApiData(); // This updates chartData and saves
        // Need to figure out how to pass the API data to onAnalyze in this case
        // For now, pass an empty array
        onAnalyzeAction([]);
      } else {
        // This case should be caught by validateData, but added for safety
        toast({
          title: 'No Data Source',
          description: 'Cannot analyze without competitor CSV or ASIN.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Catch errors from processCsvData or fetchAndProcessApiData if they re-throw
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unknown analysis error occurred';
      logger.error('Error during competitor analysis orchestration:', {
        error,
      });
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setChartData(undefined); // Ensure chart is cleared on failure
    } finally {
      setIsLoading(false); // Ensure loading indicator stops
    }
  }, [
    validateData,
    competitorData,
    asin,
    processCsvData,
    fetchAndProcessApiData,
    setIsLoading,
    setChartData,
  ]);

  const handleSaveAnalysis = useCallback(() => {
    if (!chartData || chartData.length === 0) {
      toast({
        title: 'No Data',
        description: 'No analysis results to save.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      // Include relevant context in the saved data
      const analysisData = {
        id: `analysis-${timestamp}`,
        savedAt: new Date().toLocaleString(),
        sourceAsin: asin.trim() || 'N/A (CSV Upload)', // Indicate source
        comparedMetrics: metrics,
        chartData: chartData, // The data used for the chart
        // Optionally include sellerData/competitorData if needed, mindful of size
      };

      // For demonstration, saving to localStorage (consider size limits)
      // In a real app, this might POST to a backend API
      const existingAnalysesJson = localStorage.getItem('competitorAnalyses');
      const existingAnalyses = existingAnalysesJson
        ? JSON.parse(existingAnalysesJson)
        : [];

      // Add new analysis and keep maybe last 5-10?
      const updatedAnalyses = [analysisData, ...existingAnalyses].slice(0, 5); // Keep last 5

      localStorage.setItem(
        'competitorAnalyses',
        JSON.stringify(updatedAnalyses),
      );

      toast({
        title: 'Analysis Saved',
        description: 'Analysis snapshot saved locally.',
        variant: 'default',
      });
    } catch (error) {
      logger.error('Failed to save analysis to localStorage:', { error });
      toast({
        title: 'Save Error',
        description: 'Could not save analysis data locally.',
        variant: 'destructive',
      });
    }
  }, [chartData, asin, metrics]);

  // --- Render Logic ---
  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* File Upload Section */}
        <div
          className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="seller-csv">Your Seller Data (Optional)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Upload CSV: asin, price, reviews, rating, conversion_rate,
                      click_through_rate
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="seller-csv"
              type="file" // Ensure type="file"
              accept=".csv"
              ref={sellerFileInputRef} // Assign ref
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFileUpload(e, setSellerData);
              }}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="competitor-csv">
                Competitor Data (CSV or ASIN)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload CSV with same format OR enter ASIN below.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="competitor-csv"
              type="file" // Ensure type="file"
              accept=".csv"
              ref={competitorFileInputRef} // Assign ref
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                handleFileUpload(e, setCompetitorData);
              }}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
        </div>

        {/* ASIN Input Section */}
        <div>
          <div className="space-y-2">
            <Label htmlFor="asin">Or Enter Competitor ASIN</Label>
            <Input
              id="asin"
              value={asin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAsin(e.target.value.trim().toUpperCase()); // Trim and uppercase ASIN
              }}
              placeholder="e.g., B0XXXXXXXX"
              maxLength={10} // Standard ASIN length
            />
            <p className="text-xs text-muted-foreground">
              Provide either a Competitor CSV or an ASIN.
            </p>
            {requiredError && (
              <p className="text-red-500 text-sm mt-1">{requiredError}</p>
            )}
          </div>
        </div>

        {/* Metrics Selection */}
        <div>
          <Label>Metrics to Compare</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-2">
            {(
              [
                'price',
                'reviews',
                'rating',
                'conversion_rate',
                'click_through_rate',
              ] as const
            ).map((metric) => (
              <div key={metric} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`metric-${metric}`} // Unique ID for label association
                  checked={metrics.includes(metric)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setMetrics(
                      (prevMetrics) =>
                        isChecked
                          ? [...prevMetrics, metric] // Add metric
                          : prevMetrics.filter((m) => m !== metric), // Remove metric
                    );
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor={`metric-${metric}`} className="cursor-pointer">
                  {metric
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={analyzeCompetitor} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Competitor'}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveAnalysis}
            disabled={!chartData || isLoading} // Disable if no chart data or loading
          >
            Save Analysis Snapshot
          </Button>
          {/* Optional Clear Button */}
          <Button
            variant="destructive"
            onClick={() => {
              setAsin('');
              setSellerData(null);
              setCompetitorData(null);
              setChartData(undefined);
              setMetrics(['price', 'reviews', 'rating']); // Reset metrics
              if (sellerFileInputRef.current)
                sellerFileInputRef.current.value = '';
              if (competitorFileInputRef.current)
                competitorFileInputRef.current.value = '';
              sessionStorage.removeItem('chartData');
              toast({ title: 'Inputs Cleared', variant: 'default' });
            }}
            disabled={isLoading}
          >
            Clear Inputs & Results
          </Button>
        </div>

        {/* Chart Display */}
        {chartData && chartData.length > 0 ? (
          <div className="mt-6 h-[400px] w-full border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Competitor Comparison
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: isMobile ? 5 : 30,
                  left: isMobile ? -10 : 20, // Adjust left margin for mobile
                  bottom: isMobile ? 40 : 5, // More bottom margin for angled labels
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="name"
                  angle={isMobile ? -45 : 0} // Angle labels on mobile
                  textAnchor={isMobile ? 'end' : 'middle'}
                  height={isMobile ? 60 : 30} // Allocate height for labels
                  tick={{ fontSize: isMobile ? 10 : 12 }} // Smaller font on mobile
                  interval={0} // Show all labels
                />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip // Use the aliased import
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '10px',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number | string, name: string) => [
                    typeof value === 'number' ? value.toFixed(2) : value, // Format numbers
                    name
                      .split('_')
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(' '), // Format metric name nicely
                  ]}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {metrics.map((metric) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    name={metric // Format name for legend
                      .split('_')
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(' ')}
                    stroke={getChartColor(metric)}
                    strokeWidth={2}
                    activeDot={{ r: 6 }} // Highlight active dot
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          !isLoading && ( // Only show placeholder if not loading and no chart data
            <div className="mt-6 flex items-center justify-center h-[400px] border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">
                Upload data or enter an ASIN and click "Analyze Competitor" to
                see the comparison chart.
              </p>
            </div>
          )
        )}
      </div>
    </Card>
  );
}
