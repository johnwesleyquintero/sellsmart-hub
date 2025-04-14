'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { KeywordIntelligence } from '@/lib/keyword-intelligence';

import { useToast } from '@/hooks/use-toast';

type ListingData = {
  product: string;
  title?: string;
  description?: string;
  bulletPoints?: string[];
  images?: number;
  keywords?: string[];
  keywordAnalysis?: {
    keyword: string;
    isProhibited: boolean;
    score: number;
    confidence: number;
    matchType: 'exact' | 'fuzzy' | 'pattern';
    reason?: string;
  }[];
  score?: number;
  issues?: string[];
  suggestions?: string[];
};

export default function ListingQualityChecker() {
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asin, setAsin] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Invalid file content');
        }

        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            if (results.errors.length > 0) {
              throw new Error(
                `CSV errors: ${results.errors.map((e) => e.message).join(', ')}`,
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
              (col) => !results.meta.fields.includes(col),
            );
            if (missingColumns.length > 0) {
              throw new Error(
                `Missing required columns: ${missingColumns.join(', ')}`,
              );
            }

            interface CSVRow {
              product: string;
              title: string;
              description: string;
              bullet_points: string;
              images: string;
              keywords: string;
            }

            const processedData = await Promise.all(
              results.data.map(async (row: CSVRow) => {
                const keywords =
                  row.keywords
                    ?.split(',')
                    .map((k) => k.trim())
                    .filter(Boolean) || [];

                const keywordAnalysis =
                  await KeywordIntelligence.analyzeBatch(keywords);

                return {
                  product: row.product,
                  title: row.title,
                  description: row.description,
                  bulletPoints: row.bullet_points?.split(';').filter(Boolean),
                  images: Number(row.images) || 0,
                  keywords,
                  keywordAnalysis,
                };
              }),
            );

            setListings(processedData);
            setError(null);
            toast({
              title: 'Success',
              description: `${file.name} processed successfully`,
              variant: 'default',
            });
          },
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleAsinCheck = () => {
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

      const selectedIssues = issues.filter(() => Math.random() > 0.5);

      const suggestions = [
        'Add main keywords to the beginning of your title',
        'Expand description to at least 1000 characters',
        'Add 5-6 detailed bullet points highlighting benefits',
        'Add more backend keywords to improve searchability',
        'Use a high-resolution main image with white background',
      ];

      const selectedSuggestions = suggestions.filter((_, i) =>
        selectedIssues.length > i ? true : false,
      );

      const newListing: ListingData = {
        product: `Product (ASIN: ${asin})`,
        title: Math.random() > 0.3 ? 'Product Title Example' : '',
        description:
          Math.random() > 0.3 ? 'Product description example...' : '',
        bulletPoints: Math.random() > 0.5 ? ['Bullet 1', 'Bullet 2'] : [],
        images: Math.floor(Math.random() * 7),
        keywords: Math.random() > 0.4 ? ['keyword1', 'keyword2'] : [],
        issues: selectedIssues.length
          ? selectedIssues
          : ['No major issues found'],
        suggestions: selectedSuggestions.length
          ? selectedSuggestions
          : ['Listing looks good!'],
        score: Math.max(0, 100 - selectedIssues.length * 15),
      };

      setListings([...listings, newListing]);
      setAsin('');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Card className="flex-1">
          <CardContent className="p-4">
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
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with listing details)
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium">Check by ASIN</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Amazon ASIN</label>
                  <div className="flex gap-2">
                    <Input
                      value={asin}
                      onChange={(e) => setAsin(e.target.value)}
                      placeholder="Enter ASIN (e.g., B08N5KWB9H)"
                    />
                    <Button onClick={handleAsinCheck} disabled={isLoading}>
                      Check
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={45} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Analyzing listing quality...
          </p>
        </div>
      )}

      {listings.length > 0 && (
        <div className="space-y-4">
          {listings.map((listing, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">{listing.product}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Quality Score:</span>
                    <Badge
                      variant={
                        (listing.score || 0) >= 80
                          ? 'default'
                          : (listing.score || 0) >= 50
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {listing.score || 0}/100
                    </Badge>
                  </div>
                </div>

                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Listing Details
                    </h4>
                    <div className="space-y-2 rounded-lg border p-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Title:
                        </span>
                        <span className="flex items-center text-sm">
                          {listing.title ? (
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          )}
                          {listing.title ? 'Present' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Description:
                        </span>
                        <span className="flex items-center text-sm">
                          {listing.description ? (
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          )}
                          {listing.description ? 'Present' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Bullet Points:
                        </span>
                        <span className="flex items-center text-sm">
                          {listing.bulletPoints &&
                          listing.bulletPoints.length >= 5 ? (
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          )}
                          {listing.bulletPoints
                            ? `${listing.bulletPoints.length}/5 recommended`
                            : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Images:
                        </span>
                        <span className="flex items-center text-sm">
                          {listing.images && listing.images >= 7 ? (
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          )}
                          {listing.images
                            ? `${listing.images}/7 recommended`
                            : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Keywords:
                        </span>
                        <span className="flex items-center text-sm">
                          {listing.keywords && listing.keywords.length >= 5 ? (
                            <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          )}
                          {listing.keywords
                            ? `${listing.keywords.length} keywords`
                            : 'Missing'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Issues & Suggestions
                    </h4>
                    <div className="space-y-3">
                      {listing.issues && listing.issues.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium text-red-600 dark:text-red-400">
                            Issues to Fix:
                          </h5>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            {listing.issues.map((issue, i) => (
                              <li key={i}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {listing.suggestions &&
                        listing.suggestions.length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              Suggestions:
                            </h5>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                              {listing.suggestions.map((suggestion, i) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
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
