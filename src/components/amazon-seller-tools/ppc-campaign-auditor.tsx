// Move 'use client' directive to the top of the file
'use client';

console.log('PpcCampaignAuditor component loaded');

import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  Download,
  FileText,
  Info,
  Upload,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useRef, useState } from 'react';

// Local/UI Imports
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CampaignCard from './CampaignCard';
import DataCard from './DataCard'; // Import DataCard
import SampleCsvButton from './sample-csv-button';
console.log('DataCard component loaded');

// --- Constants for Analysis ---
const HIGH_ACOS_THRESHOLD = 30; // %
const LOW_CTR_THRESHOLD = 0.3; // %
const LOW_CONVERSION_RATE_THRESHOLD = 8; // % - Assuming Sales/Clicks * 100
const LOW_CLICK_VOLUME_THRESHOLD = 100;
const GOOD_AUTO_ACOS_THRESHOLD = 20; // %

// --- Types ---
// Raw data structure expected from CSV after PapaParse dynamicTyping
interface RawCampaignData {
  name?: StringOrNull;
  type?: StringOrNull;
  spend?: NumberOrStringOrNull;
  sales?: NumberOrStringOrNull;
  impressions?: NumberOrStringOrNull;
  clicks?: NumberOrStringOrNull;
}

type StringOrNull = string | null;
type NumberOrStringOrNull = number | string | null;

// Processed and validated data structure
export type CampaignData = {
  name: string;
  type: string;
  spend: number;
  sales: number;
  impressions: number;
  clicks: number;
  acos: number; // Always calculated
  ctr: number; // Always calculated
  conversionRate: number; // Always calculated (Note: May be Sales/Click if 'sales' is revenue)
  issues: string[];
  recommendations: string[];
};

// --- Helper Functions ---

/**
 * Calculates PPC metrics safely, handling potential division by zero.
 */
function calculateMetrics(
  spend: number,
  sales: number,
  impressions: number,
  clicks: number,
): { acos: number; ctr: number; conversionRate: number } {
  const acos = sales > 0 ? (spend / sales) * 100 : Infinity;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  // NOTE: If 'sales' is revenue, this is Sales Per Click * 100, not true Conversion Rate.
  const conversionRate = clicks > 0 ? (sales / clicks) * 100 : 0;

  return { acos, ctr, conversionRate };
}

/**
 * Analyzes a single campaign's performance based on calculated metrics.
 */
function handleNoSalesCase(spend: number): { issues: string[], recommendations: string[] } {
  const issues = ['No Sales Recorded'];
  const recommendations = [];
  
  if (spend > 0) {
    recommendations.push(
      'Investigate targeting, product appeal, and listing quality. Consider pausing if spend is significant.'
    );
  } else {
    recommendations.push(
      'Campaign has no spend and no sales. Review setup or consider activating if intended.'
    );
  }
  
  return { issues, recommendations };
}

function analyzeHighAcos(acos: number): { issues: string[], recommendations: string[] } {
  return {
    issues: [`High ACoS (${acos.toFixed(1)}%)`],
    recommendations: [
      'Review search term reports and target performance. Reduce bids on unprofitable targets.',
      'Add negative keywords/ASINs to prevent irrelevant spend.'
    ]
  };
}

function analyzeLowCtr(ctr: number): { issues: string[], recommendations: string[] } {
  return {
    issues: [`Low CTR (${ctr.toFixed(2)}%)`],
    recommendations: [
      'Improve ad relevance: check keywords, ad copy (if applicable), and main image.',
      'Ensure targeting is specific enough.'
    ]
  };
}

function analyzeLowConversionRate(conversionRate: number): { issues: string[], recommendations: string[] } {
  return {
    issues: [`Low Conversion Rate (${conversionRate.toFixed(1)}%)`],
    recommendations: [
      'Optimize product detail page (title, bullets, description, images, A+ content, price, reviews).',
      'Ensure keywords/targets align closely with the product benefits and features.'
    ]
  };
}

function analyzeLowClickVolume(clicks: number): { issues: string[], recommendations: string[] } {
  return {
    issues: [`Low Click Volume (${clicks})`],
    recommendations: [
      'Consider increasing bids strategically on relevant, high-potential targets.',
      'Review campaign budget; ensure it is not limiting performance.'
    ]
  };
}

function analyzeAutoCampaign(type: string, acos: number): { recommendations: string[] } {
  if (type.toLowerCase().includes('auto') && acos < GOOD_AUTO_ACOS_THRESHOLD) {
    return {
      recommendations: [
        'Harvest high-performing search terms/ASINs from this Auto campaign into Manual campaigns for granular control.'
      ]
    };
  }
  return { recommendations: [] };
}

function analyzeCampaignPerformance(
  campaign: Omit<CampaignData, 'issues' | 'recommendations'>,
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const { acos, ctr, conversionRate, clicks, type, spend } = campaign;

  if (!isFinite(acos)) {
    const noSalesResult = handleNoSalesCase(spend);
    issues.push(...noSalesResult.issues);
    recommendations.push(...noSalesResult.recommendations);
    return { issues, recommendations };
  }

  // Analyze campaigns with sales
  if (acos > HIGH_ACOS_THRESHOLD) {
    const highAcosResult = analyzeHighAcos(acos);
    issues.push(...highAcosResult.issues);
    recommendations.push(...highAcosResult.recommendations);
  }

  if (ctr < LOW_CTR_THRESHOLD) {
    const lowCtrResult = analyzeLowCtr(ctr);
    issues.push(...lowCtrResult.issues);
    recommendations.push(...lowCtrResult.recommendations);
  }

  if (conversionRate < LOW_CONVERSION_RATE_THRESHOLD) {
    const lowConvResult = analyzeLowConversionRate(conversionRate);
    issues.push(...lowConvResult.issues);
    recommendations.push(...lowConvResult.recommendations);
  }

  if (clicks < LOW_CLICK_VOLUME_THRESHOLD) {
    const lowClickResult = analyzeLowClickVolume(clicks);
    issues.push(...lowClickResult.issues);
    recommendations.push(...lowClickResult.recommendations);
  }

  const autoCampaignResult = analyzeAutoCampaign(type, acos);
  recommendations.push(...autoCampaignResult.recommendations);

  // Add default messages if no specific issues/recommendations were found
  if (issues.length === 0) {
    issues.push('No major performance issues detected.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Performance looks stable. Continue monitoring key metrics.');
  }

  return { issues, recommendations };
}

/**
 * Processes raw data parsed from CSV into structured CampaignData.
 * Includes validation and metric calculation.
 */
function processRawCampaignData(rawData: unknown[]): { data: CampaignData[], skippedRows: number } {
  const processedData: CampaignData[] = [];
  let skippedRows = 0;

  for (const row of rawData) {
    const item = row as RawCampaignData;

    // Basic validation for required fields and types
    const name = typeof item.name === 'string' ? item.name.trim() : null;
    const type = typeof item.type === 'string' ? item.type.trim() : null;
    // Use parseFloat for potentially non-integer numbers
    const spend = typeof item.spend === 'number' ? item.spend : parseFloat(String(item.spend));
    const sales = typeof item.sales === 'number' ? item.sales : parseFloat(String(item.sales));
    const impressions = typeof item.impressions === 'number' ? item.impressions : parseInt(String(item.impressions), 10);
    const clicks = typeof item.clicks === 'number' ? item.clicks : parseInt(String(item.clicks), 10);

    if (
      !name ||
      !type ||
      isNaN(spend) || spend < 0 ||
      isNaN(sales) || sales < 0 || // Allow 0 sales
      isNaN(impressions) || impressions < 0 ||
      isNaN(clicks) || clicks < 0
    ) {
      console.warn('Skipping invalid row:', item);
      skippedRows++;
      continue; // Skip this row if essential data is missing or invalid
    }

    const metrics = calculateMetrics(spend, sales, impressions, clicks);
    const baseCampaignData = {
      name,
      type,
      spend,
      sales,
      impressions,
      clicks,
      ...metrics,
    };
    const analysis = analyzeCampaignPerformance(baseCampaignData);

    processedData.push({
      ...baseCampaignData,
      ...analysis,
    });
  }

  return { data: processedData, skippedRows };
}

// --- Component ---
console.log('PpcCampaignAuditor component rendered');
export default function PpcCampaignAuditor() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setCampaigns([]); // Clear previous results

      Papa.parse(file, {
        header: true,
        dynamicTyping: true, // Let PapaParse handle initial type conversion
        skipEmptyLines: true,
        complete: (result) => {
          setIsLoading(false); // Stop loading indicator regardless of outcome

          if (result.errors.length > 0) {
            setError(
              `Error parsing CSV: ${result.errors[0].message}. Please check the file format and ensure it matches the requirements.`,
            );
            return;
          }

          // Validate required headers
          const requiredHeaders = [
            'name',
            'type',
            'spend',
            'sales',
            'impressions',
            'clicks',
          ];
          const actualHeaders = result.meta.fields || [];
          const missingHeaders = requiredHeaders.filter(
            (header) => !actualHeaders.includes(header),
          );

          if (missingHeaders.length > 0) {
            setError(
              `Missing required columns in CSV: ${missingHeaders.join(', ')}. Please ensure your file includes all required headers.`,
            );
            return;
          }

          try {
            const { data: processedData, skippedRows } = processRawCampaignData(result.data);

            if (processedData.length === 0) {
              if (result.data.length > 0) {
                setError(
                  `No valid campaign data found after processing ${result.data.length} rows. Please check data integrity, numeric formats, and ensure required columns are populated correctly.`,
                );
              } else {
                setError(
                  'The uploaded CSV file appears to be empty or contains no data rows.',
                );
              }
            } else {
              setCampaigns(processedData);
              if (skippedRows > 0) {
                 // Optionally inform user about skipped rows
                 setError(`Successfully processed ${processedData.length} campaigns. Skipped ${skippedRows} invalid rows.`);
              }
            }
          } catch (procError) {
            console.error('Processing error:', procError);
            setError(
              `Failed to process data: ${procError instanceof Error ? procError.message : 'Unknown error'}. Please check the data within your CSV file.`,
            );
          } finally {
            // Reset file input value to allow re-uploading the same file
            if (event.target) {
              event.target.value = '';
            }
          }
        },
        error: (err: Error) => {
          setError(`Error reading CSV file: ${err.message}`);
          setIsLoading(false);
           // Reset file input on read error too
           if (event.target) {
             event.target.value = '';
           }
        },
      });
    },
    [], // No dependencies needed
  );

  const handleExport = useCallback(() => {
    if (campaigns.length === 0) {
      setError('No data to export.');
      return;
    }
    setError(null);

    const exportData = campaigns.map((campaign) => ({
      Name: campaign.name,
      Type: campaign.type,
      Spend: campaign.spend.toFixed(2),
      Sales: campaign.sales.toFixed(2),
      ACoS_Percent: isFinite(campaign.acos) ? campaign.acos.toFixed(2) : 'N/A',
      Impressions: campaign.impressions,
      Clicks: campaign.clicks,
      CTR_Percent: campaign.ctr.toFixed(2),
      ConversionRate_Percent: isFinite(campaign.conversionRate) ? campaign.conversionRate.toFixed(2) : 'N/A', // Handle potential Infinity/NaN if sales/clicks are 0
      Issues: campaign.issues.join('; '),
      Recommendations: campaign.recommendations.join('; '),
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ppc_campaign_audit.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up blob URL
    } catch (expError) {
      console.error('Export error:', expError);
      setError(
        `Failed to generate CSV: ${expError instanceof Error ? expError.message : 'Unknown error'}.`,
      );
    }
  }, [campaigns]); // Depends on campaigns state

  const clearData = useCallback(() => {
    setCampaigns([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []); // No dependencies

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Required columns (case-insensitive headers): <code>name</code>, <code>type</code>,{' '}
              <code>spend</code>, <code>sales</code>, <code>impressions</code>,{' '}
              <code>clicks</code>
            </li>
            <li>
              Numeric columns (spend, sales, impressions, clicks) must contain
              valid numbers (e.g., 123.45 or 123). Avoid currency symbols or commas within numbers.
            </li>
            <li>
              Example Row:{' '}
              <code>
                SP - Product Targeting,Sponsored Products,55.20,310.50,8500,150
              </code>
            </li>
          </ul>
        </div>
      </div>

      {/* Upload Card - Using DataCard for consistency */}
      <DataCard>
        {/* CardContent is automatically included by DataCard, adjust padding if needed */}
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          {/* Icon Circle */}
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          {/* Heading and Description */}
          <div>
            <h3 className="text-lg font-medium">Upload Campaign Report</h3>
            <p className="text-sm text-muted-foreground">
              Upload a CSV report from Amazon Advertising.
            </p>
          </div>
          {/* Upload Area */}
          <div className="w-full max-w-md">
            <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5">
              <FileText className="mb-2 h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium">
                Click or drag CSV file here
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                (Requires: name, type, spend, sales, impressions, clicks)
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
            {/* Buttons below the upload area */}
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-2">
              <SampleCsvButton
                dataType="ppc"
                fileName="sample-ppc-campaign.csv"
              />
              {campaigns.length > 0 && !isLoading && (
                <Button
                  variant="outline"
                  onClick={clearData}
                >
                  Clear Results
                </Button>
              )}
            </div>
          </div>
        </div>
      </DataCard>

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
            Analyzing campaign performance...
          </p>
        </div>
      )}

      {/* Results Section */}
      {campaigns.length > 0 && !isLoading && (
        <DataCard> {/* Wrap results in DataCard */}
          <CardContent className="p-4 space-y-6"> {/* Add padding and spacing */}
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b pb-3">
              <h2 className="text-xl font-semibold">
                Audit Results ({campaigns.length} Campaigns)
              </h2>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Audit Report
              </Button>
            </div>

            {/* Campaign List */}
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                // Using a simple Card wrapper for each result item
                <Card key={`${campaign.name}-${index}`}>
                  <CardContent className="p-4">
                    {/* Render basic info using CampaignCard */}
                    <CampaignCard campaign={campaign} />

                    {/* Display Issues and Recommendations directly here */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                      {/* Issues Section */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">
                          Detected Issues ({campaign.issues.length})
                        </h4>
                        {campaign.issues.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                            {campaign.issues.map((issue, i) => (
                              <li key={`issue-${index}-${i}`}>{issue}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            None
                          </p>
                        )}
                      </div>
                      {/* Recommendations Section */}
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                          Recommendations ({campaign.recommendations.length})
                        </h4>
                        {campaign.recommendations.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                            {campaign.recommendations.map((rec, i) => (
                              <li key={`rec-${index}-${i}`}>{rec}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            None
                          </p>
                        )}
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
