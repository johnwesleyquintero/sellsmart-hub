// src/components/amazon-seller-tools/keyword-analyzer.tsx
'use client';

import { type KeywordAnalysis } from '@/lib/keyword-intelligence';
import { AlertCircle } from 'lucide-react';
import React from 'react';
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

// Local/UI Imports
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// --- Constants ---
const BATCH_SIZE = 50; // Process keywords in batches

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

// --- Helper Functions ---

// Processes keywords in batches using KeywordIntelligence

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

interface KeywordAnalyzerProps {
  product: KeywordData;
  index: number;
}

const KeywordAnalyzer: React.FC<KeywordAnalyzerProps> = ({
  product,
  index,
}) => {
  let productLocal: KeywordData;
  try {
    console.log('product:', product);
    productLocal = product;

    console.log('KeywordAnalyzer rendered with product:', productLocal);
    // product = JSON.parse(productString);
    return (
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
            <h3 className="text-lg font-medium break-all">
              {productLocal?.product}
            </h3>
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
              {productLocal?.searchVolume !== undefined && (
                <>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Search Vol:
                  </span>
                  <Badge variant="outline">
                    {productLocal?.searchVolume?.toLocaleString()}
                  </Badge>
                </>
              )}
              {productLocal?.competition && (
                <>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Competition:
                  </span>
                  <Badge
                    variant={getCompetitionVariant(productLocal?.competition)}
                  >
                    {productLocal?.competition}
                  </Badge>
                </>
              )}
              {productLocal?.prohibitedCount > 0 && (
                <Badge variant="destructive">
                  {productLocal?.prohibitedCount} Prohibited
                </Badge>
              )}
            </div>
          </div>

          {/* Keywords & Analysis Section */}
          <div className="space-y-4">
            {/* Original Keywords List */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Original Keywords ({productLocal?.keywords?.length})
              </h4>
              <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-3 min-h-[50px]">
                {productLocal?.keywords?.length > 0 ? (
                  productLocal?.keywords?.map((keyword, i) => (
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
            {productLocal?.analysis && productLocal?.analysis?.length > 0 ? (
              <div className="h-80 w-full">
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Keyword Analysis Scores
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productLocal?.analysis}
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

            {/* Suggestions */}
            {productLocal?.suggestions &&
              productLocal?.suggestions?.length > 0 && (
                <div className="pt-4 border-t border-dashed">
                  <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Suggested Keywords (High Potential)
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {productLocal?.suggestions?.map((keyword, i) => (
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
  } catch (error: unknown) {
    console.error('Error parsing product data:', error);
    return (
      <Card>
        <CardContent className="p-4">
          <AlertCircle className="mr-2 h-4 w-4" />
          Error displaying product analysis - Invalid JSON.
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message}
          </p>
        </CardContent>
      </Card>
    );
  }
};

export { KeywordAnalyzer };
