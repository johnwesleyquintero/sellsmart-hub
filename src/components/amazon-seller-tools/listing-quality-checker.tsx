// src/components/amazon-seller-tools/listing-quality-checker.tsx
'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Upload,
  XCircle,
} from 'lucide-react';

// Local/UI Imports
import DataCard from '@/components/amazon-seller-tools/DataCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

// Lib/Logic Imports (Assuming KeywordIntelligence exists and works as expected)
import { KeywordIntelligence } from '@/lib/keyword-intelligence';

// --- Types ---

interface CSVRow {
  product: string;
  title: string;
  description: string;
  bullet_points: string; // Semicolon-separated
  images: string; // Should be a number string
  keywords: string; // Comma-separated
}

type KeywordAnalysisResult = {
  keyword: string;
  isProhibited: boolean;
  score: number;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'pattern';
  reason?: string;
};

type ListingData = {
  product: string;
  title?: string;
  description?: string;
  bulletPoints?: string[];
  images?: number;
  keywords?: string[];
  keywordAnalysis?: KeywordAnalysisResult[];
  score?: number;
  issues?: string[];
  suggestions?: string[];
};

// --- Helper Functions ---

const validateCSVData = (results: Papa.ParseResult<CSVRow>) => {
  if (results.errors.length > 0) {
    throw new Error(
      `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
    );
  }

  const requiredColumns = [
    'product',
    'title',
    'description',
    'bullet_points',
    'images',
    'keywords',
  ];
  const missingColumns = requiredColumns.filter(
    (col) => !results.meta.fields?.includes(col),
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }
};

const processCSVRow = async (row: CSVRow): Promise<ListingData> => {
  const keywords =
    row.keywords
      ?.split(',')
      .map((k) => k.trim())
      .filter(Boolean) || [];
  const images = Number(row.images);
  const bulletPoints = row.bullet_points?.split(';').filter(Boolean) || [];

  // Basic validation within row processing
  if (isNaN(images)) {
    console.warn(`Invalid image count for product "${row.product}"`);
  }

  let keywordAnalysis: KeywordAnalysisResult[] = [];
  try {
    // Assuming KeywordIntelligence.analyze returns the expected type
    keywordAnalysis = await KeywordIntelligence.analyze(keywords);
  } catch (analysisError) {
    console.error(
      `Keyword analysis failed for product "${row.product}":`,
      analysisError,
    );
    // Decide how to handle: skip analysis, set default, etc.
  }

  // Simplified scoring and issue generation (can be expanded)
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!row.title) {
    issues.push('Missing title');
    suggestions.push('Add a compelling title including main keywords.');
    score -= 20;
  }
  if (!row.description || row.description.length < 200) {
    issues.push('Description too short or missing');
    suggestions.push('Expand description to detail features and benefits.');
    score -= 15;
  }
  if (bulletPoints.length < 3) {
    issues.push('Insufficient bullet points');
    suggestions.push('Add at least 3-5 bullet points highlighting key benefits.');
    score -= 15;
  }
  if (isNaN(images) || images < 5) {
    issues.push('Insufficient images');
    suggestions.push('Include at least 5-7 high-quality images.');
    score -= 10;
  }
  if (keywords.length === 0) {
    issues.push('Missing keywords');
    suggestions.push('Add relevant keywords for searchability.');
    score -= 10;
  }
  // Add more checks (e.g., keyword analysis results)

  return {
    product: row.product,
    title: row.title,
    description: row.description,
    bulletPoints,
    images: isNaN(images) ? 0 : images,
    keywords,
    keywordAnalysis,
    score: Math.max(0, score), // Ensure score doesn't go below 0
    issues: issues.length > 0 ? issues : ['No major issues found'],
    suggestions: suggestions.length > 0 ? suggestions : ['Listing looks good!'],
  };
};

// Extracted CSV parsing logic to reduce nesting and complexity
const parseAndProcessCsv = (content: string): Promise<ListingData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(content, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          validateCSVData(results);
          // Process rows concurrently
          const processedData = await Promise.all(results.data.map(processCSVRow));
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
    return 'default'; // Good
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

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          if (typeof content !== 'string') {
            throw new Error('Invalid file content');
          }
          const processedData = await parseAndProcessCsv(content); // Use extracted function
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
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
          // Reset file input if needed
          if (event.target) {
            event.target.value = '';
          }
        }
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        toast({
          title: 'Error',
          description: 'Failed to read the file.',
          variant: 'destructive',
        });
        setIsLoading(false);
      };
      reader.readAsText(file);
    },
    [toast],
  ); // Added toast dependency

  const handleAsinCheck = useCallback(() => {
    if (!asin.trim()) {
      setError('Please enter an ASIN');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call for ASIN lookup
    setTimeout(() => {      
      // Generate a random listing with issues
      const issues = [
        'Title missing main keywords',
        'Description too short',
        'Not enough bullet points',
        'Missing backend keywords',
        'Low-quality main image',
      ];

      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      const selectedIssues = issues.filter(() => Math.random() > 0.5);

      const suggestions = [
        'Add main keywords to the beginning of your title',
        'Expand description to at least 1000 characters',
        'Add 5-6 detailed bullet points highlighting benefits',
        'Add more backend keywords to improve searchability',
        'Use a high-resolution main image with white background',
      ];

      const selectedSuggestions = suggestions.slice(0, selectedIssues.length);

      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      const titlePresent = Math.random() > 0.3;
      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      const descPresent = Math.random() > 0.3;
      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      const bulletsPresent = Math.random() > 0.5;
      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      const imagesCount = Math.floor(Math.random() * 8); // 0-7 images
      // eslint-disable-next-line sonarjs/pseudo-random -- Acceptable for mock data generation
      const keywordsPresent = Math.random() > 0.4;

        const newListing: ListingData = {
          product: `Product (ASIN: ${asin})`,
          title: titlePresent ? 'Product Title Example' : '',
          description: descPresent ? 'Product description example...' : '',
          bulletPoints: bulletsPresent ? ['Bullet 1', 'Bullet 2'] : [],
          images: imagesCount,
          keywords: keywordsPresent ? ['keyword1', 'keyword2'] : [],
          issues: selectedIssues.length
            ? selectedIssues
            : ['No major issues found'],
          suggestions: selectedSuggestions.length
            ? selectedSuggestions
            : ['Listing looks good!'],
          score: Math.max(0, 100 - selectedIssues.length * 15),
        };

      setListings((prevListings) => [...prevListings, newListing]);
      setAsin('');
      setError(null); // Clear error on success
      setIsLoading(false);
    }, 1500);
  }, [asin]); // Added asin and toast dependencies

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* CSV Upload Card */}
        <DataCard>
          <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Upload CSV</h3>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with your listing data
              </p>
            </div>
            <div className="w-full">
              <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">Click to upload CSV</span>
                <span className="text-xs text-muted-foreground">
                  (Requires: product, title, description, bullet_points,
                  images, keywords)
                </span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
              {/* Add Sample CSV Button if available */}
              {/* <SampleCsvButton dataType="listing-quality" fileName="sample-listing-quality.csv" className="mt-4" /> */}
            </div>
          </div>
        </DataCard>

        {/* ASIN Check Card */}
        <DataCard>
          <div className="space-y-4 p-6">
            {' '}
            {/* Adjusted padding */}
            <h3 className="text-lg font-medium text-center sm:text-left">
              Check by ASIN
            </h3>{' '}
            {/* Centered on mobile */}
            <div className="space-y-3">
              <div>
                <label htmlFor="asin-input" className="text-sm font-medium">
                  Amazon ASIN
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {' '}
                  {/* Stack on mobile */}
                  <Input
                    id="asin-input"
                    value={asin}
                    onChange={(e) => setAsin((e.target as HTMLInputElement).value)}
                    placeholder="Enter ASIN (e.g., B08N5KWB9H)"
                    className="flex-grow"
                  />
                  <Button
                    onClick={handleAsinCheck}
                    disabled={isLoading || !asin.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Checking...' : 'Check'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DataCard>
      </div>

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
            Analyzing listing quality...
          </p>
        </div>
      )}

      {/* Results Section */}
      {listings.length > 0 && !isLoading && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          {listings.map((listing, index) => (
            <Card key={`${listing.product}-${index}`}>
              {' '}
              {/* Improved key */}
              <CardContent className="p-4">
                {/* Header */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-lg font-medium break-all">
                    {listing.product}
                  </h3>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-sm font-medium whitespace-nowrap">
                      Quality Score:
                    </span>
                    <Badge variant={getBadgeVariant(listing.score ?? 0)}>
                      {listing.score ?? 0}/100
                    </Badge>
                  </div>
                </div>

                {/* Details & Issues/Suggestions Grid */}
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  {/* Listing Details */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Listing Details Checklist
                    </h4>
                    <div className="space-y-2 rounded-lg border p-3">
                      {/* Title Check */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Title:
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                          Description:
                        </span>
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
                        <span className="text-sm text-muted-foreground">
                          Bullet Points:
                        </span>
                        <span className="flex items-center text-sm text-right">
                          {(listing.bulletPoints?.length ?? 0) >= 3 ? ( // Check for >= 3
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          {listing.bulletPoints?.length ?? 0} / 5+ recommended
                        </span>
                      </div>
                      {/* Images Check */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Images:
                        </span>
                        <span className="flex items-center text-sm text-right">
                          {(listing.images ?? 0) >= 5 ? ( // Check for >= 5
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          {listing.images ?? 0} / 7+ recommended
                        </span>
                      </div>
                      {/* Keywords Check */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Keywords:
                        </span>
                        <span className="flex items-center text-sm text-right">
                          {(listing.keywords?.length ?? 0) > 0 ? ( // Check if any keywords exist
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          {listing.keywords?.length ?? 0} keywords found
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Issues & Suggestions */}
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Issues & Suggestions
                    </h4>
                    <div className="space-y-3 rounded-lg border p-3 min-h-[180px]">
                      {' '}
                      {/* Added min-height */}
                      {listing.issues && listing.issues.length > 0 ? (
                        <div className="space-y-1">
                          <h5 className="text-xs font-semibold text-red-600 dark:text-red-400">
                            Issues to Fix:
                          </h5>
                          <ul className="list-inside list-disc space-y-1 text-sm text-red-700 dark:text-red-300">
                            {listing.issues.map((issue, i) => (
                              <li key={`issue-${i}`}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          No major issues found.
                        </p>
                      )}

                      {listing.suggestions &&
                      listing.suggestions.length > 0 ? (
                        <div className="space-y-1 pt-2 border-t border-dashed mt-2">
                          <h5 className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Suggestions:
                          </h5>
                          <ul className="list-inside list-disc space-y-1 text-sm text-blue-700 dark:text-blue-300">
                            {listing.suggestions.map((suggestion, i) => (
                              <li key={`suggestion-${i}`}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground pt-2 border-t border-dashed mt-2">
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
      )}
    </div>
  );
}
