// src/components/amazon-seller-tools/keyword-analyzer.tsx
'use client';

import { useToast } from '@/hooks/use-toast';
import { fetchKeywordAnalysis } from '@/lib/api/keyword-analysis';
import { logError } from '@/lib/error-handling';
import { type KeywordAnalysis } from '@/lib/keyword-intelligence';
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
import { z } from 'zod'; // Import Zod

// Local/UI Imports
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import DataCard from './DataCard';
import SampleCsvButton from './sample-csv-button';

// --- Constants ---
const BATCH_SIZE = 50; // Process keywords in batches
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const REQUIRED_CSV_HEADERS = ['product', 'keywords'];

// --- Types ---
type KeywordData = {
  product: string;
  keywords: string[];
  searchVolume: number | undefined;
  competition: 'Low' | 'Medium' | 'High' | undefined;
  analysis: KeywordAnalysis[];
  suggestions?: string[];
  prohibitedCount: number;
  averageScore: number;
  averageConfidence: number;
};

interface CsvInputRow {
  product?: string;
  keywords: string;
  searchVolume?: number | string; // Allow string for PapaParse flexibility
  competition?: string;
}

// --- Helper Functions ---

// Processes keywords in batches using KeywordIntelligence
async function processKeywordBatch(
  keywords: string[],
): Promise<KeywordAnalysis[]> {
  const results: KeywordAnalysis[] = [];
  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);
    try {
      // Use the analyze method from KeywordIntelligence
      const batchResults = await fetchKeywordAnalysis(batch);
      results.push(...batchResults);
    } catch (error) {
      logError({
        message: 'Error analyzing keyword batch',
        component: 'KeywordAnalyzer/processKeywordBatch',
        severity: 'medium',
        error: error as Error,
        context: { batchSize: batch.length, startIndex: i },
      });
      // Propagate error to be handled by the caller
      throw new Error(
        `Failed to analyze batch starting at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  return results;
}

// Processes a single row from the CSV data
async function processCsvRow(
  item: CsvInputRow,
  rowIndex: number,
): Promise<KeywordData | null> {
  const productName = item.product?.trim();
  if (!productName) {
    // Log silently or with low severity, handled by filtering later
    return null;
  }

  const keywords =
    item.keywords
      ?.split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean) ?? [];

  if (keywords.length === 0) {
    return null;
  }

  try {
    const analysis = await processKeywordBatch(keywords); // Use batch processing

    const searchVolumeRaw = item.searchVolume;
    // Handle both number and string inputs for searchVolume
    const searchVolume =
      typeof searchVolumeRaw === 'number' && !isNaN(searchVolumeRaw)
        ? searchVolumeRaw
        : typeof searchVolumeRaw === 'string' &&
            searchVolumeRaw !== '' &&
            !isNaN(Number(searchVolumeRaw))
          ? Number(searchVolumeRaw)
          : undefined;

    const competitionRaw = item.competition?.trim().toLowerCase();
    const competition =
      competitionRaw &&
      (competitionRaw === 'low' ||
        competitionRaw === 'medium' ||
        competitionRaw === 'high')
        ? ((competitionRaw.charAt(0).toUpperCase() +
            competitionRaw.slice(1)) as 'Low' | 'Medium' | 'High')
        : undefined;

    const prohibitedCount = analysis.filter((a) => a.isProhibited).length;
    const totalScore = analysis.reduce((sum, a) => sum + a.score, 0);
    const totalConfidence = analysis.reduce((sum, a) => sum + a.confidence, 0);
    const averageScore = analysis.length > 0 ? totalScore / analysis.length : 0;
    const averageConfidence =
      analysis.length > 0 ? totalConfidence / analysis.length : 0;

    // Example suggestion logic (adjust as needed)
    const suggestions = analysis
      .filter((a) => !a.isProhibited && a.score >= 70 && a.confidence >= 0.8)
      .map((a) => a.keyword);

    return {
      product: productName,
      keywords,
      searchVolume,
      competition,
      analysis,
      suggestions,
      prohibitedCount,
      averageScore,
      averageConfidence,
    };
  } catch (error) {
    logError({
      message: 'Error processing CSV row analysis',
      component: 'KeywordAnalyzer/processCsvRow',
      severity: 'medium',
      error: error as Error,
      context: {
        rowIndex: rowIndex + 1,
        product: productName,
        keywordCount: keywords.length,
      },
    });
    return null; // Skip row on analysis error
  }
}

// Gets badge variant based on competition level
const getCompetitionVariant = (
  competition?: 'Low' | 'Medium' | 'High',
): 'default' | 'outline' | 'destructive' => {
  switch (competition) {
    case 'Low':
      return 'default'; // Use 'default' for positive/low
    case 'Medium':
      return 'outline';
    case 'High':
      return 'destructive';
    default:
      return 'outline'; // Default if undefined
  }
};

// --- Sub-Components ---

// Form validation schema
const formSchema = z.object({
  keyword: z.string().min(1, { message: 'Keyword is required' }),
  category: z.string().min(1, { message: 'Product category is required' }),
});

type FormData = z.infer<typeof formSchema>;

const initialFormData: FormData = {
  keyword: '',
  category: '',
};

type FormErrors = {
  keyword?: string;
  category?: string;
};

const KeywordAnalyzerInfoBox: React.FC = () => (
  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
    <div className="text-sm text-blue-700 dark:text-blue-300">
      <p className="font-medium">How it Works:</p>
      <ul className="list-disc list-inside ml-4">
        <li>
          Upload a CSV with &apos;product&apos; and comma-separated
          &apos;keywords&apos; columns. Optional: &apos;searchVolume&apos;,
          &apos;competition&apos; (Low/Medium/High).
        </li>
        <li>Or, manually enter comma-separated keywords for quick analysis.</li>
        <li>
          The tool analyzes each keyword&apos;s potential (score, confidence,
          prohibited status).
        </li>
        <li>
          View keyword scores, identify prohibited terms, and see suggestions
          for high-potential keywords.
        </li>
        <li>Export the detailed analysis results to a CSV file.</li>
      </ul>
    </div>
  </div>
);

interface CsvUploadSectionProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const CsvUploadSection: React.FC<CsvUploadSectionProps> = ({
  onFileUpload,
  isLoading,
  fileInputRef,
}) => (
  <DataCard>
    <CardContent className="p-6">
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
              (Requires: {REQUIRED_CSV_HEADERS.join(', ')})
            </span>
            <input
              type="file"
              accept=".csv, text/csv"
              className="hidden"
              onChange={onFileUpload}
              disabled={isLoading}
              ref={fileInputRef}
            />
          </label>
          <div className="flex justify-center mt-4">
            <SampleCsvButton
              dataType="keyword" // Ensure this type exists
              fileName="sample-keyword-analyzer.csv"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </DataCard>
);

interface ManualAnalysisSectionProps {
  manualKeywords: string;
  onKeywordsChange: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const ManualAnalysisSection: React.FC<ManualAnalysisSectionProps> = ({
  manualKeywords,
  onKeywordsChange,
  onAnalyze,
  isLoading,
}) => (
  <DataCard>
    <CardContent className="p-6">
      <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
        Manual Keyword Analysis
      </h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="manual-keywords" className="text-sm font-medium">
            Keywords*
          </Label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <Input
              id="manual-keywords"
              value={manualKeywords}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onKeywordsChange(e.target.value)
              }
              placeholder="Enter keywords, comma-separated"
              className="flex-grow"
              disabled={isLoading}
            />
            <Button
              onClick={onAnalyze}
              disabled={isLoading || !manualKeywords.trim()}
              className="flex-shrink-0 w-full sm:w-auto"
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
);

interface ProductAnalysisCardProps {
  product: KeywordData;
  index: number;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({
  product,
  index,
}) => (
  <Card>
    <CardContent className="p-4">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <h3 className="text-lg font-medium break-all">{product.product}</h3>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {product.searchVolume !== undefined && (
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
              <Badge variant={getCompetitionVariant(product.competition)}>
                {product.competition}
              </Badge>
            </>
          )}
          {product.prohibitedCount > 0 && (
            <Badge variant="destructive">
              {product.prohibitedCount} Prohibited
            </Badge>
          )}
        </div>
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
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Keyword Analysis Scores
            </h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={product.analysis}
                margin={{ top: 5, right: 5, left: -10, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="keyword"
                  tick={{ fontSize: 10 }}
                  angle={-40}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ fontSize: '12px', padding: '5px 10px' }}
                  formatter={(
                    value: number,
                    name: string,
                    props: { payload?: { isProhibited?: boolean } },
                  ) => [
                    `${value.toFixed(0)}${props?.payload?.isProhibited ? ' (Prohibited)' : ''}`,
                    'Score',
                  ]}
                  labelFormatter={(label: string) => `Keyword: ${label}`}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="score"
                  name="Analysis Score"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                ></Bar>
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

        {/* Suggestions */}
        {product.suggestions && product.suggestions.length > 0 && (
          <div className="pt-4 border-t border-dashed">
            <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Suggested Keywords (High Potential)
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
);

interface AnalysisResultsProps {
  products: KeywordData[];
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ products }) => (
  <DataCard>
    <CardContent className="p-4 space-y-6">
      <h2 className="text-xl font-semibold border-b pb-3">
        Analysis Results ({products.length} Products/Entries)
      </h2>
      <div className="space-y-4">
        {products.map((product, index) => (
          <ProductAnalysisCard
            key={`${product.product}-${index}`} // Ensure unique key
            product={product}
            index={index}
          />
        ))}
      </div>
    </CardContent>
  </DataCard>
);

interface ActionButtonsProps {
  onExport: () => void;
  onClear: () => void;
  isLoading: boolean;
  hasData: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onExport,
  onClear,
  isLoading,
  hasData,
}) => {
  if (!hasData || isLoading) {
    return null;
  }
  return (
    <div className="flex justify-end gap-2 mb-6">
      <Button variant="outline" onClick={onExport} disabled={isLoading}>
        <Download className="mr-2 h-4 w-4" />
        Export Analysis
      </Button>
      <Button variant="destructive" onClick={onClear} disabled={isLoading}>
        <XCircle className="mr-2 h-4 w-4" />
        Clear Results
      </Button>
    </div>
  );
};

interface LoadingIndicatorProps {
  isLoading: boolean;
  progress: number | null;
}

// Corrected LoadingIndicator component
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  progress,
}) => {
  if (!isLoading) {
    return null;
  }
  return (
    <div className="space-y-2 py-4 text-center">
      <Progress
        value={progress ?? undefined} // Use undefined for indeterminate
        className="h-2 w-1/2 mx-auto"
      />
      <p className="text-sm text-muted-foreground">
        {progress !== null
          ? `Analyzing keywords... ${progress.toFixed(0)}%` // Show percentage
          : 'Analyzing keywords...'}
      </p>
    </div>
  );
};

interface ErrorDisplayProps {
  error: string | null;
  onErrorDismiss: () => void;
}

// Corrected ErrorDisplay component
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onErrorDismiss,
}) => {
  if (!error) {
    return null;
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <span className="flex-grow break-words">{error}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onErrorDismiss}
        className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0"
        aria-label="Dismiss error"
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

// --- Main Component ---
export default function KeywordAnalyzer() {
  const { toast } = useToast();
  const [products, setProducts] = useState<KeywordData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualKeywords, setManualKeywords] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData); // State for the new form
  const [formErrors, setFormErrors] = useState<FormErrors>({}); // State for form errors
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for the new form's input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear the specific error when the user starts typing
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Handler for the new form's analyze button
  const handleAnalyze = async () => {
    try {
      // Validate form data using Zod schema
      const validatedData = formSchema.parse(formData);
      setFormErrors({}); // Clear previous errors on successful validation

      setIsLoading(true);
      setError(null);
      setProgress(null); // Use indeterminate for this analysis

      const keywords = validatedData.keyword
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      if (keywords.length === 0) {
        throw new Error('No valid keywords entered after trimming.');
      }

      const analysis = await processKeywordBatch(keywords); // Use batch processing

      const prohibitedCount = analysis.filter((a) => a.isProhibited).length;
      const totalScore = analysis.reduce((sum, a) => sum + a.score, 0);
      const totalConfidence = analysis.reduce(
        (sum, a) => sum + a.confidence,
        0,
      );
      const averageScore =
        analysis.length > 0 ? totalScore / analysis.length : 0;
      const averageConfidence =
        analysis.length > 0 ? totalConfidence / analysis.length : 0;
      const suggestions = analysis
        .filter((a) => !a.isProhibited && a.score >= 70 && a.confidence >= 0.8)
        .map((a) => a.keyword);

      const newProduct: KeywordData = {
        // Use category as product name for this analysis type
        product: `Analysis for Category: ${validatedData.category}`,
        keywords,
        analysis,
        suggestions,
        prohibitedCount,
        averageScore,
        averageConfidence,
        searchVolume: undefined, // Not applicable for this form
        competition: undefined, // Not applicable for this form
      };

      // Replace existing results or add to them based on desired behavior
      setProducts([newProduct]); // Replace results with the new analysis
      setFormData(initialFormData); // Reset the form
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${keywords.length} keywords for category ${validatedData.category}.`,
        variant: 'default',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle Zod validation errors
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormErrors] = err.message;
          }
        });
        setFormErrors(newErrors);
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please check the highlighted fields.',
        });
      } else {
        // Handle other errors (e.g., API errors from processKeywordBatch)
        const message =
          error instanceof Error ? error.message : 'Failed to analyze keywords';
        setError(message);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // --- Other Handlers (handleFileUpload, handleManualAnalysis, handleExport, clearData) ---
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setProducts([]);
      setProgress(0); // Start progress

      try {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          );
        }

        const parseResult = await new Promise<Papa.ParseResult<CsvInputRow>>(
          (resolve, reject) => {
            Papa.parse<CsvInputRow>(file, {
              header: true,
              skipEmptyLines: true,
              complete: resolve,
              error: reject,
            });
          },
        );

        if (parseResult.errors.length > 0) {
          const errorMessage = parseResult.errors
            .map((err) => `Row ${err.row}: ${err.message}`)
            .join('; ');
          throw new Error(`CSV parsing errors: ${errorMessage}`);
        }

        const actualHeaders =
          parseResult.meta.fields?.map((h) => h.toLowerCase()) || [];
        const missingHeaders = REQUIRED_CSV_HEADERS.filter(
          (header) => !actualHeaders.includes(header.toLowerCase()), // Ensure case-insensitive check
        );

        if (missingHeaders.length > 0) {
          throw new Error(
            `Missing required CSV columns: ${missingHeaders.join(', ')}. Found: ${actualHeaders.join(', ') || 'None'}`,
          );
        }

        if (parseResult.data.length === 0) {
          throw new Error(
            'The uploaded CSV file appears to be empty or contains no data rows.',
          );
        }

        // Process rows and update progress
        const processedProducts: KeywordData[] = [];
        const totalRows = parseResult.data.length;

        for (let i = 0; i < totalRows; i++) {
          const result = await processCsvRow(parseResult.data[i], i);
          if (result) {
            processedProducts.push(result);
          }
          // Update progress after each row (or batch if preferred)
          setProgress(Math.round(((i + 1) / totalRows) * 100));
        }

        if (processedProducts.length === 0) {
          throw new Error(
            "No valid product/keyword data found in the CSV after processing. Ensure 'product' and 'keywords' columns are present and populated.",
          );
        }

        setProducts(processedProducts);
        setError(null);
        toast({
          title: 'Analysis Complete',
          description: `Successfully analyzed ${processedProducts.length} products.`,
          variant: 'default',
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred during processing.';
        setError(message);
        setProducts([]);
        toast({
          title: 'Processing Failed',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setProgress(null); // Reset progress
        if (event.target) {
          event.target.value = ''; // Reset file input
        }
      }
    },
    [toast], // Keep toast dependency
  );

  const handleManualAnalysis = useCallback(async () => {
    const trimmedKeywords = manualKeywords.trim();
    if (!trimmedKeywords) {
      setError('Please enter keywords to analyze.');
      toast({
        title: 'Input Required',
        description: 'Please enter keywords to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null); // Use indeterminate loading for manual

    try {
      const keywords = trimmedKeywords
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      if (keywords.length === 0) {
        throw new Error('No valid keywords entered after trimming.');
      }

      const analysis = await processKeywordBatch(keywords); // Use batch processing

      const prohibitedCount = analysis.filter((a) => a.isProhibited).length;
      const totalScore = analysis.reduce((sum, a) => sum + a.score, 0);
      const totalConfidence = analysis.reduce(
        (sum, a) => sum + a.confidence,
        0,
      );
      const averageScore =
        analysis.length > 0 ? totalScore / analysis.length : 0;
      const averageConfidence =
        analysis.length > 0 ? totalConfidence / analysis.length : 0;
      const suggestions = analysis
        .filter((a) => !a.isProhibited && a.score >= 70 && a.confidence >= 0.8)
        .map((a) => a.keyword);

      const newProduct: KeywordData = {
        product: `Manual Analysis (${new Date().toLocaleTimeString()})`,
        keywords,
        analysis,
        suggestions,
        prohibitedCount,
        averageScore,
        averageConfidence,
        searchVolume: undefined,
        competition: undefined,
      };

      setProducts((prev) => [...prev, newProduct]);
      setManualKeywords('');
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
  }, [manualKeywords, toast]);

  const handleExport = useCallback(() => {
    if (products.length === 0) {
      setError('No data to export.');
      toast({
        title: 'Export Error',
        description: 'No data to export.',
        variant: 'destructive',
      });
      return;
    }
    setError(null);

    // Flatten data for export
    const exportData = products.flatMap((product) =>
      product.analysis.map((analysisItem) => ({
        Product: product.product,
        Keyword: analysisItem.keyword,
        Score: analysisItem.score.toFixed(2),
        Confidence: analysisItem.confidence.toFixed(3),
        Is_Prohibited: analysisItem.isProhibited,
        Reason: analysisItem.reason ?? '',
        Match_Type: analysisItem.matchType,
        Search_Volume: product.searchVolume ?? '', // Include optional data
        Competition: product.competition ?? '', // Include optional data
      })),
    );

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'keyword_analysis_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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
  }, [products, toast]);

  const clearData = useCallback(() => {
    setProducts([]);
    setError(null);
    setManualKeywords('');
    setFormData(initialFormData); // Reset the new form data
    setFormErrors({}); // Clear form errors
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Data Cleared',
      description: 'All analysis results have been removed.',
      variant: 'default',
    });
  }, [toast]);

  // --- Render ---
  return (
    <div className="space-y-6">
      <KeywordAnalyzerInfoBox />

      {/* New Form Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4 text-center sm:text-left">
            Analyze Keyword by Category
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyword">Keyword(s)</Label>
              <Input
                id="keyword"
                name="keyword"
                value={formData.keyword}
                onChange={handleInputChange}
                placeholder="Enter keyword(s), comma-separated"
                className="mt-1"
              />
              {formErrors.keyword && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.keyword}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Product Category</Label>
              {/* Using select for predefined categories */}
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="">Select a category</option>
                {/* Add more relevant categories */}
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="home">Home & Kitchen</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="sports">Sports & Outdoors</option>
                <option value="toys">Toys & Games</option>
              </select>
              {formErrors.category && (
                <p
                  data-testid="category-error"
                  className="text-sm text-red-500 mt-1"
                >
                  {formErrors.category}
                </p>
              )}
            </div>

            <Button
              onClick={handleAnalyze} // Use the new handler
              className="w-full"
              disabled={isLoading} // Disable while loading
            >
              <Search className="mr-2 h-4 w-4" />
              Analyze Category Keywords
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Input Section (CSV and Old Manual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CsvUploadSection
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
          fileInputRef={fileInputRef}
        />
        {/* Keep the old manual section if still needed, or remove */}
        <ManualAnalysisSection
          manualKeywords={manualKeywords}
          onKeywordsChange={setManualKeywords}
          onAnalyze={handleManualAnalysis}
          isLoading={isLoading}
        />
      </div>

      <ActionButtons
        onExport={handleExport}
        onClear={clearData}
        isLoading={isLoading}
        hasData={products.length > 0}
      />

      <ErrorDisplay error={error} onErrorDismiss={() => setError(null)} />

      <LoadingIndicator isLoading={isLoading} progress={progress} />

      {/* Results Section */}
      {products.length > 0 && !isLoading && (
        <AnalysisResults products={products} />
      )}
    </div>
  );
}
