// src/components/amazon-seller-tools/listing-quality-checker.tsx
'use client';

import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Info,
  Search,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useRef, useState } from 'react';

// Local/UI Imports
import DataCard from '@/components/amazon-seller-tools/DataCard';
import SampleCsvButton from '@/components/amazon-seller-tools/sample-csv-button'; // Added
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Added
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Lib/Logic Imports (Assuming KeywordIntelligence exists and works as expected)
// NOTE: KeywordIntelligence logic is simplified/mocked in processCSVRow

// --- Types ---

export interface CSVRow {
  product: string;
  title: string;
  description: string;
  bullet_points: string; // Semicolon-separated
  images: string; // Should be a number string
  keywords: string; // Comma-separated
}

// NOTE: This depends on the actual KeywordIntelligence implementation
export type KeywordAnalysisResult = {
  keyword: string;
  isProhibited: boolean;
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'pattern';
  reason?: string;
};

export type ListingData = {
  product: string;
  title?: string;
  description?: string;
  bulletPoints?: string[];
  images?: number;
  keywords?: string[];
  keywordAnalysis?: KeywordAnalysisResult[]; // Result from KeywordIntelligence
  score: number; // Calculated score
  issues: string[]; // Detected problems
  suggestions: string[]; // Improvement ideas
};

// --- Constants ---

const REQUIRED_COLUMNS = [
  'product',
  'title',
  'description',
  'bullet_points',
  'images',
  'keywords',
] as const;
// Thresholds for scoring (can be adjusted)
const MIN_TITLE_LENGTH = 50;
const MAX_TITLE_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_BULLET_POINTS = 3;
const RECOMMENDED_BULLET_POINTS = 5;
const MIN_IMAGES = 3;
const RECOMMENDED_IMAGES = 7;

// --- Helper Functions ---

const validateCSVData = (results: Papa.ParseResult<CSVRow>) => {
  if (results.errors.length > 0) {
    throw new Error(
      `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
    );
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !results.meta.fields?.includes(col),
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
};

type ListingScoreResult = Pick<ListingData, 'score' | 'issues' | 'suggestions'>;

// Simplified scoring logic - can be expanded significantly
const calculateScoreAndIssues = (
  data: Omit<ListingData, 'score' | 'issues' | 'suggestions'>,
): ListingScoreResult => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100; // Start with a perfect score

  // Title Checks
  if (!data.title) {
    issues.push('Missing title');
    suggestions.push('Add a compelling title including main keywords.');
    score -= 20;
  } else if (data.title.length < MIN_TITLE_LENGTH) {
    issues.push(`Title too short (min ${MIN_TITLE_LENGTH} chars)`);
    suggestions.push('Expand title to be more descriptive.');
    score -= 10;
  } else if (data.title.length > MAX_TITLE_LENGTH) {
    issues.push(`Title too long (max ${MAX_TITLE_LENGTH} chars)`);
    suggestions.push('Shorten title for better readability.');
    score -= 5;
  }

  // Description Checks
  if (!data.description) {
    issues.push('Missing description');
    suggestions.push(
      `Write a detailed description (${MIN_DESCRIPTION_LENGTH}-${MAX_DESCRIPTION_LENGTH} chars recommended).`,
    );
    score -= 15;
  } else if (data.description.length < MIN_DESCRIPTION_LENGTH) {
    issues.push(`Description too short (min ${MIN_DESCRIPTION_LENGTH} chars)`);
    suggestions.push('Expand description to detail features and benefits.');
    score -= 10;
  } else if (data.description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push(`Description too long (max ${MAX_DESCRIPTION_LENGTH} chars)`);
    suggestions.push('Condense description, focus on key selling points.');
    score -= 5;
  }

  // Bullet Points Check
  const bulletCount = data.bulletPoints?.length ?? 0;
  if (bulletCount < MIN_BULLET_POINTS) {
    issues.push(
      `Insufficient bullet points (found ${bulletCount}, min ${MIN_BULLET_POINTS})`,
    );
    suggestions.push(
      `Add at least ${RECOMMENDED_BULLET_POINTS} bullet points highlighting key benefits.`,
    );
    score -= 15;
  }

  // Images Check
  const imageCount = data.images ?? 0;
  if (imageCount < MIN_IMAGES) {
    issues.push(`Insufficient images (found ${imageCount}, min ${MIN_IMAGES})`);
    suggestions.push(
      `Include at least ${RECOMMENDED_IMAGES} high-quality images.`,
    );
    score -= 15;
  }

  // Keywords Check
  if (!data.keywords || data.keywords.length === 0) {
    issues.push('Missing keywords');
    suggestions.push('Add relevant keywords for searchability.');
    score -= 10;
  }

  // Placeholder for Keyword Analysis Issues
  // if (data.keywordAnalysis?.some(k => k.isProhibited)) {
  //   issues.push("Prohibited keywords found");
  //   suggestions.push("Review and remove prohibited keywords.");
  //   score -= 20;
  // }

  return {
    score: Math.max(0, score), // Ensure score doesn't go below 0
    issues: issues.length > 0 ? issues : [], // Return empty array if no issues
    suggestions: suggestions.length > 0 ? suggestions : [], // Return empty array if no suggestions
  };
};

const processCSVRow = async (row: CSVRow): Promise<ListingData> => {
  const keywords =
    row.keywords
      ?.split(',')
      .map((k) => k.trim())
      .filter(Boolean) || [];
  const images = Number(row.images);
  const bulletPoints =
    row.bullet_points
      ?.split(';')
      .map((s) => s.trim())
      .filter(Boolean) || [];

  // Basic validation within row processing
  if (isNaN(images)) {
    console.warn(`Invalid image count for product "${row.product}"`);
  }

  let keywordAnalysis: KeywordAnalysisResult[] = [];
  // --- MOCK KEYWORD ANALYSIS ---
  // Replace with actual KeywordIntelligence call if available and configured
  try {
    // keywordAnalysis = await KeywordIntelligence.analyze(keywords);
    // Mock response for demonstration:
    await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate async call
    keywordAnalysis = keywords.map((kw) => ({
      keyword: kw,
      // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
      isProhibited: Math.random() > 0.9, // Mock 10% chance of being prohibited
      // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
      score: Math.floor(Math.random() * 100),
      // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
      confidence: Math.random(),
      matchType: 'exact',
    }));
  } catch (analysisError) {
    console.error(
      `Keyword analysis failed for product "${row.product}":`,
      analysisError,
    );
    // Handle analysis failure, e.g., add an issue/suggestion
  }
  // --- END MOCK ---

  const baseData: Omit<ListingData, 'score' | 'issues' | 'suggestions'> = {
    product: row.product,
    title: row.title,
    description: row.description,
    bulletPoints,
    images: isNaN(images) ? 0 : images,
    keywords,
    keywordAnalysis,
  };

  const analysis = calculateScoreAndIssues(baseData);

  return {
    ...baseData,
    ...analysis,
  };
};

// Extracted CSV parsing logic
const parseAndProcessCsv = (content: string): Promise<ListingData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          validateCSVData(results);
          if (results.data.length === 0) {
            throw new Error('CSV contains no valid data rows.');
          }
          // Process rows concurrently
          const processedData = await Promise.all(
            results.data.map(processCSVRow),
          );
          resolve(processedData);
        } catch (parseError) {
          reject(
            parseError instanceof Error
              ? parseError
              : new Error('An error occurred during CSV processing'),
          );
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

const getBadgeVariant = (
  score: number,
): 'default' | 'secondary' | 'destructive' => {
  if (score >= 80) {
    return 'default'; // Good (using 'default' as success)
  } else if (score >= 50) {
    return 'secondary'; // Fair
  } else {
    return 'destructive'; // Poor
  }
};

// --- Component ---

export default function ListingQualityChecker() {
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asin, setAsin] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setListings([]); // Clear previous results

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          if (typeof content !== 'string') {
            throw new Error('Invalid file content');
          }
          const processedData = await parseAndProcessCsv(content);
          setListings(processedData);
          setError(null);
          toast({
            title: 'Success',
            description: `${file.name} processed successfully with ${processedData.length} listings.`,
            variant: 'default',
          });
        } catch (uploadError) {
          const errorMessage =
            uploadError instanceof Error
              ? uploadError.message
              : 'An unknown error occurred during file processing';
          setError(errorMessage);
          setListings([]); // Clear listings on error
          toast({
            title: 'Error Processing CSV',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        toast({
          title: 'Error Reading File',
          description: 'Could not read the selected file.',
          variant: 'destructive',
        });
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    },
    [toast],
  );

  // --- MOCK ASIN CHECK ---
  // Replace this with your actual API call logic
  const fetchAsinDataMock = async (
    asinToCheck: string,
  ): Promise<ListingData> => {
    console.log(`Simulating API call for ASIN: ${asinToCheck}`);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    // Generate mock data (similar to previous version but structured better)
    // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
    const hasTitle = Math.random() > 0.2;
    // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
    const hasDesc = Math.random() > 0.2;
    // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
    const numBullets = Math.floor(Math.random() * 6); // 0-5
    // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
    const numImages = Math.floor(Math.random() * 9); // 0-8
    // eslint-disable-next-line sonarjs/pseudo-random -- Mock data
    const hasKeywords = Math.random() > 0.3;

    const mockRow: CSVRow = {
      product: `Product (ASIN: ${asinToCheck})`,
      title: hasTitle
        ? `Mock Title for ${asinToCheck} - Feature A, Feature B`
        : '',
      description: hasDesc
        ? `This is a mock description for ${asinToCheck}. It highlights key benefits like durability and ease of use. Designed for optimal performance.`.repeat(
            3,
          )
        : '',
      bullet_points: Array.from(
        { length: numBullets },
        (_, i) => `Mock Bullet Point ${i + 1}`,
      ).join(';'),
      images: String(numImages),
      keywords: hasKeywords
        ? 'mock keyword, asin check, sample data, quality score'
        : '',
    };

    // Process the mock row as if it came from a CSV
    const processedListing = await processCSVRow(mockRow);
    return processedListing;
  };
  // --- END MOCK ASIN CHECK ---

  const handleAsinCheck = useCallback(async () => {
    const trimmedAsin = asin.trim();
    if (!trimmedAsin) {
      setError('Please enter an ASIN');
      toast({
        title: 'Input Required',
        description: 'Please enter an ASIN to check.',
        variant: 'destructive',
      });
      return;
    }

    // Basic ASIN format check (optional but helpful)
    if (!/^[A-Z0-9]{10}$/i.test(trimmedAsin)) {
      setError('Invalid ASIN format. Should be 10 alphanumeric characters.');
      toast({
        title: 'Invalid Format',
        description: 'ASIN should be 10 letters/numbers.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Replace fetchAsinDataMock with your actual API call
      const newListing = await fetchAsinDataMock(trimmedAsin);

      // Check if ASIN already exists in the list to avoid duplicates
      if (listings.some((l) => l.product.includes(`(ASIN: ${trimmedAsin})`))) {
        toast({
          title: 'ASIN Already Added',
          description: `Analysis for ASIN ${trimmedAsin} is already displayed.`,
          variant: 'default',
        });
      } else {
        setListings((prevListings) => [...prevListings, newListing]);
        toast({
          title: 'ASIN Check Complete',
          description: `Analysis for ${trimmedAsin} added.`,
          variant: 'default',
        });
      }
      setAsin(''); // Clear input after successful check
      setError(null);
    } catch (apiError) {
      const errorMessage =
        apiError instanceof Error
          ? apiError.message
          : 'Failed to fetch or analyze ASIN data.';
      setError(errorMessage);
      toast({
        title: 'ASIN Check Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [asin, toast, listings]); // Added listings to dependency array for duplicate check

  const clearData = useCallback(() => {
    setListings([]);
    setError(null);
    setAsin('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All listing analysis results have been removed.',
      variant: 'default',
    });
  }, [toast]);

  const handleExport = useCallback(() => {
    if (listings.length === 0) {
      setError('No data to export.');
      toast({
        title: 'Export Error',
        description: 'No analysis results to export.',
        variant: 'destructive',
      });
      return;
    }
    setError(null);

    // Prepare data for export
    const exportData = listings.map((l) => ({
      Product: l.product,
      Score: l.score,
      Title_Present: l.title ? 'Yes' : 'No',
      Description_Present: l.description ? 'Yes' : 'No',
      Bullet_Points_Count: l.bulletPoints?.length ?? 0,
      Image_Count: l.images ?? 0,
      Keywords_Count: l.keywords?.length ?? 0,
      Issues: l.issues.join('; '),
      Suggestions: l.suggestions.join('; '),
      // Optionally include raw data if needed
      // Title: l.title,
      // Description: l.description,
      // Bullet_Points: l.bulletPoints?.join('; '),
      // Keywords: l.keywords?.join(', '),
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'listing_quality_analysis.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: 'Export Successful',
        description: 'Analysis results exported to CSV.',
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
  }, [listings, toast]);

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
              Upload a CSV with listing details (product, title, description,
              bullet_points, images, keywords).
            </li>
            <li>
              Alternatively, enter an ASIN to fetch and analyze (mock data used
              for demo).
            </li>
            <li>
              The tool checks for completeness, length requirements, and keyword
              presence.
            </li>
            <li>
              A quality score (0-100) is calculated based on detected issues.
            </li>
            <li>View issues and suggestions for each listing.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <DataCard>
          {/* Using CardContent directly for padding control */}
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload Listings CSV</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bulk analyze listings from a CSV file
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click or drag CSV file here
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    (Requires: {REQUIRED_COLUMNS.join(', ')})
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
                <SampleCsvButton
                  dataType="listing-quality" // You'll need to add this type to your sample data generator
                  fileName="sample-listing-quality.csv"
                  className="mt-4"
                />
              </div>
            </div>
          </CardContent>
        </DataCard>

        {/* ASIN Check Card */}
        <DataCard>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
              Check Single Listing by ASIN
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="asin-input" className="text-sm font-medium">
                  Amazon ASIN
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <Input
                    id="asin-input"
                    value={asin}
                    onChange={(e) => setAsin(e.target.value)}
                    placeholder="Enter ASIN (e.g., B08N5KWB9H)"
                    className="flex-grow"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleAsinCheck}
                    disabled={isLoading || !asin.trim()}
                    className="w-full sm:w-auto"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {isLoading ? 'Checking...' : 'Check ASIN'}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Uses mock data for demonstration. Replace with actual API
                  call.
                </p>
              </div>
            </div>
          </CardContent>
        </DataCard>
      </div>

      {/* Action Buttons */}
      {listings.length > 0 && !isLoading && (
        <div className="flex justify-end gap-2 mb-6">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
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
          <p className="text-sm text-muted-foreground">
            Analyzing listing quality...
          </p>
        </div>
      )}

      {/* Results Section */}
      {listings.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-4 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-3">
              Analysis Results ({listings.length} Listings)
            </h2>
            <div className="space-y-4">
              {listings.map((listing, index) => (
                <Card key={`${listing.product}-${index}`}>
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
                      <h3 className="text-lg font-medium break-all">
                        {listing.product}
                      </h3>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-sm font-medium whitespace-nowrap">
                          Quality Score:
                        </span>
                        <Badge variant={getBadgeVariant(listing.score)}>
                          {listing.score}/100
                        </Badge>
                      </div>
                    </div>

                    {/* Details & Issues/Suggestions Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Listing Details Checklist */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                          Checklist
                        </h4>
                        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                          {/* Title Check */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Title:</span>
                            <span className="flex items-center text-sm">
                              {listing.title ? (
                                <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              {listing.title ? 'Present' : 'Missing'}
                            </span>
                          </div>
                          {/* Description Check */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Description:</span>
                            <span className="flex items-center text-sm">
                              {listing.description ? (
                                <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              {listing.description ? 'Present' : 'Missing'}
                            </span>
                          </div>
                          {/* Bullet Points Check */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Bullet Points:</span>
                            <span className="flex items-center text-sm text-right">
                              {(listing.bulletPoints?.length ?? 0) >=
                              MIN_BULLET_POINTS ? (
                                <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              {listing.bulletPoints?.length ?? 0} (Rec:{' '}
                              {RECOMMENDED_BULLET_POINTS}+)
                            </span>
                          </div>
                          {/* Images Check */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Images:</span>
                            <span className="flex items-center text-sm text-right">
                              {(listing.images ?? 0) >= MIN_IMAGES ? (
                                <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              {listing.images ?? 0} (Rec: {RECOMMENDED_IMAGES}+)
                            </span>
                          </div>
                          {/* Keywords Check */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Keywords:</span>
                            <span className="flex items-center text-sm text-right">
                              {(listing.keywords?.length ?? 0) > 0 ? (
                                <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                              {listing.keywords?.length ?? 0} found
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Issues & Suggestions */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                          Analysis
                        </h4>
                        <div className="space-y-3 rounded-lg border p-3 min-h-[180px]">
                          {listing.issues.length > 0 ? (
                            <div className="space-y-1">
                              <h5 className="text-xs font-semibold text-red-600 dark:text-red-400">
                                Detected Issues ({listing.issues.length}):
                              </h5>
                              <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
                                {listing.issues.map((issue, i) => (
                                  <li key={`issue-${index}-${i}`}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                              <CheckCircle className="mr-1 h-4 w-4 flex-shrink-0" />{' '}
                              No major issues found.
                            </p>
                          )}
                          {listing.suggestions.length > 0 ? (
                            <div className="space-y-1 pt-3 border-t border-dashed mt-3">
                              <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                Suggestions ({listing.suggestions.length}):
                              </h5>
                              <ul className="list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                                {listing.suggestions.map((suggestion, i) => (
                                  <li key={`suggestion-${index}-${i}`}>
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground pt-3 border-t border-dashed mt-3">
                              No specific suggestions at this time.
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
