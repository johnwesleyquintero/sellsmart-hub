// src/components/amazon-seller-tools/listing-quality-checker.tsx
'use client';

import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Search,
  Upload,
  X,
} from 'lucide-react';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';

// Local/UI Imports
import DataCard from '@/components/amazon-seller-tools/DataCard';
import SampleCsvButton from '@/components/amazon-seller-tools/sample-csv-button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'; // Added Accordion components
import { Badge } from '@/components/ui/badge'; // Added Badge
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardHeader, CardTitle, CardDescription
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  asin?: string | undefined; // Optional ASIN field
}

export interface AsinData {
  title: string;
  description: string[]; // Description from API might be an array
  bulletPoints: string[];
  imageCount: number;
  keywords: string[];
  brand?: string | undefined;
  category?: string | undefined;
  rating?: number | undefined;
  reviewCount?: number | undefined;
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
  brand?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
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

// Scoring Weights
const WEIGHTS = {
  title: 20,
  description: 20,
  bulletPoints: 15,
  images: 15,
  keywords: 15,
  brand: 5,
  rating: 5,
  reviewCount: 5,
} as const;

// Thresholds for scoring
const MIN_TITLE_LENGTH = 50;
const MAX_TITLE_LENGTH = 200;
const MIN_DESCRIPTION_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_BULLET_POINTS = 3;
const RECOMMENDED_BULLET_POINTS = 5;
const MIN_IMAGES = 3;
const RECOMMENDED_IMAGES = 7;
const MIN_KEYWORDS = 5;
const RECOMMENDED_KEYWORDS = 10;
const MIN_REVIEW_COUNT = 10;
const MIN_RATING = 3.5;

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

// Helper functions to calculate scores for different aspects
const calculateTitleScore = (
  title: string | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let titleScore = 0;
  if (title) {
    if (title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH) {
      titleScore = WEIGHTS.title;
    } else if (title.length < MIN_TITLE_LENGTH) {
      issues.push(
        `Title too short (${title.length}/${MIN_TITLE_LENGTH} chars)`,
      );
      suggestions.push('Expand title with relevant keywords and key features.');
      titleScore = Math.floor(
        (title.length / MIN_TITLE_LENGTH) * WEIGHTS.title,
      );
    } else {
      issues.push(
        `Title exceeds maximum length (${title.length}/${MAX_TITLE_LENGTH} chars)`,
      );
      suggestions.push(
        'Optimize title length while maintaining key information.',
      );
      titleScore = Math.floor(
        (MAX_TITLE_LENGTH / title.length) * WEIGHTS.title,
      );
    }
  } else {
    issues.push('Missing product title');
    suggestions.push('Add a descriptive title with main keywords.');
  }
  return titleScore;
};

const calculateDescriptionScore = (
  description: string | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let descScore = 0;
  if (description) {
    if (
      description.length >= MIN_DESCRIPTION_LENGTH &&
      description.length <= MAX_DESCRIPTION_LENGTH
    ) {
      descScore = WEIGHTS.description;
    } else if (description.length < MIN_DESCRIPTION_LENGTH) {
      issues.push(
        `Description too short (${description.length}/${MIN_DESCRIPTION_LENGTH} chars)`,
      );
      suggestions.push('Expand description with detailed product information.');
      descScore = Math.floor(
        (description.length / MIN_DESCRIPTION_LENGTH) * WEIGHTS.description,
      );
    } else {
      issues.push(
        `Description exceeds recommended length (${description.length}/${MAX_DESCRIPTION_LENGTH} chars)`,
      );
      suggestions.push('Consider condensing while maintaining key details.');
      descScore = Math.floor(
        (MAX_DESCRIPTION_LENGTH / description.length) * WEIGHTS.description,
      );
    }
  } else {
    issues.push('Missing product description');
    suggestions.push('Add a comprehensive product description.');
  }
  return descScore;
};

const calculateBulletPointsScore = (
  bulletPoints: string[] | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let bulletScore = 0;
  const bulletCount = bulletPoints?.length ?? 0;
  if (bulletCount >= RECOMMENDED_BULLET_POINTS) {
    bulletScore = WEIGHTS.bulletPoints;
  } else if (bulletCount >= MIN_BULLET_POINTS) {
    bulletScore = Math.floor(
      (bulletCount / RECOMMENDED_BULLET_POINTS) * WEIGHTS.bulletPoints,
    );
    suggestions.push(
      `Consider adding ${RECOMMENDED_BULLET_POINTS - bulletCount} more bullet points.`,
    );
  } else {
    issues.push(
      `Insufficient bullet points (${bulletCount}/${MIN_BULLET_POINTS} minimum)`,
    );
    suggestions.push(
      `Add at least ${MIN_BULLET_POINTS - bulletCount} more bullet points.`,
    );
    bulletScore =
      bulletCount > 0
        ? Math.floor((bulletCount / MIN_BULLET_POINTS) * WEIGHTS.bulletPoints)
        : 0;
  }
  return bulletScore;
};

const calculateImagesScore = (
  images: number | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let imageScore = 0;
  const imageCount = images ?? 0;
  if (imageCount >= RECOMMENDED_IMAGES) {
    imageScore = WEIGHTS.images;
  } else if (imageCount >= MIN_IMAGES) {
    imageScore = Math.floor((imageCount / RECOMMENDED_IMAGES) * WEIGHTS.images);
    suggestions.push(
      `Consider adding ${RECOMMENDED_IMAGES - imageCount} more images.`,
    );
  } else {
    issues.push(`Insufficient images (${imageCount}/${MIN_IMAGES} minimum)`);
    suggestions.push(
      `Add at least ${MIN_IMAGES - imageCount} more high-quality images.`,
    );
    imageScore =
      imageCount > 0
        ? Math.floor((imageCount / MIN_IMAGES) * WEIGHTS.images)
        : 0;
  }
  return imageScore;
};

const calculateKeywordsScore = (
  keywords: string[] | undefined,
  keywordAnalysis: KeywordAnalysisResult[] | undefined,
  issues: string[],
  suggestions: string[],
): number => {
  let keywordScore = 0;
  if (keywords && keywords.length > 0) {
    const keywordCount = keywords.length;
    if (keywordCount >= RECOMMENDED_KEYWORDS) {
      keywordScore = WEIGHTS.keywords;
    } else if (keywordCount >= MIN_KEYWORDS) {
      keywordScore = Math.floor(
        (keywordCount / RECOMMENDED_KEYWORDS) * WEIGHTS.keywords,
      );
      suggestions.push(
        `Consider adding ${RECOMMENDED_KEYWORDS - keywordCount} more relevant keywords.`,
      );
    } else {
      issues.push(
        `Insufficient keywords (${keywordCount}/${MIN_KEYWORDS} minimum)`,
      );
      suggestions.push(
        `Add at least ${MIN_KEYWORDS - keywordCount} more relevant keywords.`,
      );
      keywordScore = Math.floor(
        (keywordCount / MIN_KEYWORDS) * WEIGHTS.keywords,
      );
    }

    // Check for prohibited keywords
    const prohibitedCount =
      keywordAnalysis?.filter((k) => k.isProhibited).length ?? 0;
    if (prohibitedCount > 0) {
      issues.push(`Found ${prohibitedCount} prohibited keywords`);
      suggestions.push('Remove or replace prohibited keywords.');
      keywordScore = Math.max(0, keywordScore - prohibitedCount * 2);
    }
  } else {
    issues.push('Missing keywords');
    suggestions.push('Add relevant keywords to improve searchability.');
  }
  return keywordScore;
};

// Enhanced scoring logic with weighted factors and comprehensive checks
const calculateScoreAndIssues = (
  data: Omit<ListingData, 'score' | 'issues' | 'suggestions'>,
): ListingScoreResult => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let totalScore = 0;

  // Title Analysis (20 points)
  totalScore += calculateTitleScore(data.title, issues, suggestions);

  // Description Analysis (20 points)
  totalScore += calculateDescriptionScore(
    data.description,
    issues,
    suggestions,
  );

  // Bullet Points Analysis (15 points)
  totalScore += calculateBulletPointsScore(
    data.bulletPoints,
    issues,
    suggestions,
  );

  // Images Analysis (15 points)
  totalScore += calculateImagesScore(data.images, issues, suggestions);

  // Keywords Analysis (15 points)
  totalScore += calculateKeywordsScore(
    data.keywords,
    data.keywordAnalysis,
    issues,
    suggestions,
  );

  // Brand and Category Bonus (5 points each)
  if (data.brand) totalScore += WEIGHTS.brand;
  else suggestions.push('Add brand information if applicable.');

  // Rating and Review Analysis (5 points each)
  if (data.rating && data.rating >= MIN_RATING) {
    totalScore += WEIGHTS.rating;
  } else if (data.rating) {
    issues.push(`Low product rating (${data.rating.toFixed(1)}/5.0)`);
    suggestions.push('Address common customer concerns to improve rating.');
  }

  if (data.reviewCount && data.reviewCount >= MIN_REVIEW_COUNT) {
    totalScore += WEIGHTS.reviewCount;
  } else if (data.reviewCount) {
    suggestions.push('Work on getting more customer reviews.');
  }

  return {
    score: Math.max(0, Math.min(100, totalScore)), // Ensure score is between 0 and 100
    issues: issues.length > 0 ? issues : [],
    suggestions: suggestions.length > 0 ? suggestions : [],
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
      isProhibited: Math.random() > 0.9, // Mock 10% chance of being prohibited
      score: Math.floor(Math.random() * 100),
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
  const [error, setError] = useState<string | undefined>(undefined);
  const [asin, setAsin] = useState('');

  // Enhance scoring with weighted criteria
  // const calculateScore = (listing: ListingData) => { // Removed duplicate function
  //   // Add weights from real-world performance data
  //   const performanceWeights = {
  //     conversionRate: 0.4,
  //     clickThroughRate: 0.3,
  //     searchRanking: 0.3
  //   };
  //   // ... existing scoring logic
  //   // Placeholder: Integrate the scoring logic here
  // };

  // Add AI validation metrics tracking
  // const [metrics, setMetrics] = useState({ // Removed unused state
  //   suggestionAccuracy: 0,
  //   acceptanceRate: 0,
  //   effectivenessScore: 0
  // });
  const fileInputRef = useRef<HTMLInputElement>(null); // Corrected ref type

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(undefined);
      setListings([]);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const target = e.target as FileReader;
          const content = target.result;
          if (typeof content !== 'string') {
            throw new Error('Invalid file content');
          }
          const processedData = await parseAndProcessCsv(content);
          setListings(processedData);
          setError(undefined);
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
          setError(`An error occurred: ${errorMessage}`);
          setListings([]);
          toast({
            title: 'Error Processing CSV',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
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

  const fetchAsinDataMock = async (
    asinToCheck: string,
  ): Promise<ListingData> => {
    try {
      const response = await fetch(`/api/amazon/listing/${asinToCheck}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ASIN data: ${response.statusText}`);
      }

      const data: AsinData = await response.json();

      // FIX: Join description array into a string
      const descriptionString = Array.isArray(data.description)
        ? data.description.join('\n') // Join with newlines or spaces as appropriate
        : data.description || ''; // Handle case where it might already be a string or null/undefined

      const row: CSVRow = {
        product: `Product (ASIN: ${asinToCheck})`,
        title: data.title || '',
        description: descriptionString, // Use the joined string
        bullet_points: data.bulletPoints?.join(';') || '',
        images: String(data.imageCount || 0),
        keywords: data.keywords?.join(',') || '',
        asin: asinToCheck,
      };

      const processedListing = await processCSVRow(row);

      return {
        ...processedListing,
        brand: data.brand,
        category: data.category,
        rating: data.rating,
        reviewCount: data.reviewCount,
      };
    } catch (error) {
      console.error('Error fetching ASIN data:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch ASIN data',
      );
    }
  };

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
    setError(undefined);

    try {
      const newListing = await fetchAsinDataMock(trimmedAsin);

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
      setAsin('');
      setError(undefined);
    } catch (apiError) {
      const errorMessage =
        apiError instanceof Error
          ? apiError.message
          : 'Failed to fetch or analyze ASIN data.';
      setError(`An error occurred: ${errorMessage}`);
      toast({
        title: 'ASIN Check Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [asin, toast, listings]);

  const clearData = useCallback(() => {
    setListings([]);
    setError(undefined);
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
    setError(undefined);

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
            {/* FIX: Moved list items inside the ul */}
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
        {/* FIX: Added missing closing div tag */}
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
                    ref={fileInputRef} // Corrected ref assignment
                  />
                </label>
                <SampleCsvButton
                  dataType="keyword" // Assuming 'keyword' type provides the correct sample format
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAsin(e.target.value)
                    }
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
            {/* Display error specific to ASIN check if needed */}
            {error && asin && (
              <Card className="mt-4 bg-destructive/10 text-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="font-semibold">ASIN Check Error</h3>
                  </div>
                  <div className="mt-3 text-sm">{error}</div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </DataCard>
        {/* FIX: Added missing closing div tag for the grid */}
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

      {/* General Error Display (for CSV upload/processing) */}
      {error &&
        !asin && ( // Only show general error if not related to ASIN check
          <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
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
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{listing.product}</span>
                      <Badge variant={getBadgeVariant(listing.score)}>
                        Score: {listing.score}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details">
                        <AccordionTrigger>Details</AccordionTrigger>
                        <AccordionContent className="text-sm space-y-1">
                          <p>
                            <strong>Title:</strong> {listing.title || 'N/A'}
                          </p>
                          <p>
                            <strong>Bullet Points:</strong>{' '}
                            {listing.bulletPoints?.length ?? 0}
                          </p>
                          <p>
                            <strong>Images:</strong> {listing.images ?? 0}
                          </p>
                          <p>
                            <strong>Keywords:</strong>{' '}
                            {listing.keywords?.length ?? 0}
                          </p>
                          {listing.rating !== undefined && (
                            <p>
                              <strong>Rating:</strong>{' '}
                              {listing.rating.toFixed(1)}/5.0
                            </p>
                          )}
                          {listing.reviewCount !== undefined && (
                            <p>
                              <strong>Reviews:</strong> {listing.reviewCount}
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="issues">
                        <AccordionTrigger>
                          Issues ({listing.issues.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          {listing.issues.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1 text-sm text-red-700 dark:text-red-300">
                              {listing.issues.map((issue, i) => (
                                <li key={`issue-${index}-${i}`}>{issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No major issues detected.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="suggestions">
                        <AccordionTrigger>
                          Suggestions ({listing.suggestions.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          {listing.suggestions.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                              {listing.suggestions.map((suggestion, i) => (
                                <li key={`suggestion-${index}-${i}`}>
                                  {suggestion}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No specific suggestions.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </DataCard>
      )}
      {/* FIX: Added missing closing div tag for the main component div */}
    </div>
  );
}
