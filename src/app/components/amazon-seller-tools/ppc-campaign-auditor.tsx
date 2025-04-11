'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  AlertCircle,
  Download,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import Papa from 'papaparse';
import SampleCsvButton from './sample-csv-button';

type CampaignData = {
  name: string;
  type: string;
  spend: number;
  sales: number;
  acos?: number;
  impressions: number;
  clicks: number;
  ctr?: number;
  conversionRate?: number;
  issues?: string[];
  recommendations?: string[];
};

export default function PpcCampaignAuditor() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    Papa.parse<CampaignData>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          setError(
            `Error parsing CSV file: ${result.errors[0].message}. Please check the format.`,
          );
          setIsLoading(false);
          return;
        }

        try {
          // Process the parsed data
          const processedData: CampaignData[] = result.data
            .filter(
              (item) =>
                item.name &&
                item.type &&
                !isNaN(Number(item.spend)) &&
                !isNaN(Number(item.sales)) &&
                !isNaN(Number(item.impressions)) &&
                !isNaN(Number(item.clicks)),
            )
            .map((item) => {
              // Calculate metrics
              const spend = Number(item.spend);
              const sales = Number(item.sales);
              const impressions = Number(item.impressions);
              const clicks = Number(item.clicks);

              const acos = (spend / sales) * 100;
              const ctr = (clicks / impressions) * 100;
              const conversionRate = (sales / clicks) * 100;

              // Analyze campaign performance
              const issues: string[] = [];
              const recommendations: string[] = [];

              if (acos > 30) {
                issues.push('High ACoS');
                recommendations.push('Reduce bids on keywords with high ACoS');
              }

              if (ctr < 0.3) {
                issues.push('Low CTR');
                recommendations.push(
                  'Improve ad copy and images to increase CTR',
                );
              }

              if (conversionRate < 8) {
                issues.push('Low conversion rate');
                recommendations.push(
                  'Optimize product listing and target more relevant keywords',
                );
              }

              if (clicks < 100) {
                issues.push('Low click volume');
                recommendations.push(
                  'Increase bids or budget to get more visibility',
                );
              }

              if (item.type === 'Auto' && acos < 20) {
                recommendations.push(
                  'Extract converting search terms and create manual campaigns',
                );
              }

              return {
                name: String(item.name),
                type: String(item.type),
                spend,
                sales,
                acos,
                impressions,
                clicks,
                ctr,
                conversionRate,
                issues,
                recommendations,
              };
            });

          if (processedData.length === 0) {
            setError(
              'No valid data found in CSV. Please ensure your CSV has columns: name, type, spend, sales, impressions, clicks',
            );
            setIsLoading(false);
            return;
          }

          setCampaigns(processedData);
          setIsLoading(false);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to process CSV data. Please ensure your CSV has the correct format';
          setError(errorMessage);
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV file: ${error.message}`);
        setIsLoading(false);
      },
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    if (campaigns.length === 0) {
      setError('No data to export');
      return;
    }

    // Prepare data for CSV export
    const exportData = campaigns.map((campaign) => ({
      name: campaign.name,
      type: campaign.type,
      spend: campaign.spend,
      sales: campaign.sales,
      acos: campaign.acos?.toFixed(2),
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      ctr: campaign.ctr?.toFixed(2),
      conversionRate: campaign.conversionRate?.toFixed(2),
      issues: campaign.issues?.join('; '),
      recommendations: campaign.recommendations?.join('; '),
    }));

    // Create CSV content
    const csv = Papa.unparse(exportData);

    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ppc_campaign_audit.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearData = () => {
    setCampaigns([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Your CSV file should have the following columns: <code>name</code>,{' '}
            <code>type</code>, <code>spend</code>, <code>sales</code>,{' '}
            <code>impressions</code>, <code>clicks</code>
          </p>
          <p className="mt-1">
            Example: <code>name,type,spend,sales,impressions,clicks</code>
            <br />
            <code>
              Auto Campaign - Wireless Earbuds,Auto,245.67,1245.89,12450,320
            </code>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload Campaign Data</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file with your Amazon PPC campaign data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (Download campaign report from Amazon Ads and upload here)
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    ref={fileInputRef}
                  />
                </label>
                <div className="flex justify-center mt-4">
                  <SampleCsvButton
                    dataType="ppc"
                    fileName="sample-ppc-campaign.csv"
                  />
                </div>
                {campaigns.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={clearData}
                  >
                    Clear Data
                  </Button>
                )}
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
            Analyzing campaign performance...
          </p>
        </div>
      )}

      {campaigns.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Audit Report
            </Button>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{campaign.name}</h3>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      ACoS: {campaign.acos?.toFixed(2)}% • CTR:{' '}
                      {campaign.ctr?.toFixed(2)}% • Conversion Rate:{' '}
                      {campaign.conversionRate?.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">
                        Performance Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Spend
                          </div>
                          <div className="text-xl font-semibold">
                            ${campaign.spend.toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Sales
                          </div>
                          <div className="text-xl font-semibold">
                            ${campaign.sales.toFixed(2)}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Impressions
                          </div>
                          <div className="text-xl font-semibold">
                            {campaign.impressions.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-lg border p-3">
                          <div className="text-sm text-muted-foreground">
                            Clicks
                          </div>
                          <div className="text-xl font-semibold">
                            {campaign.clicks.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Audit Results
                      </h4>
                      <div className="space-y-3">
                        {campaign.issues && campaign.issues.length > 0 && (
                          <div className="space-y-1">
                            <h5 className="text-xs font-medium text-red-600 dark:text-red-400">
                              Issues Identified:
                            </h5>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                              {campaign.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <TrendingDown className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {campaign.recommendations &&
                          campaign.recommendations.length > 0 && (
                            <div className="space-y-1">
                              <h5 className="text-xs font-medium text-green-600 dark:text-green-400">
                                Recommendations:
                              </h5>
                              <ul className="list-inside list-disc space-y-1 text-sm">
                                {campaign.recommendations.map(
                                  (recommendation, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1"
                                    >
                                      <TrendingUp className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                                      <span>{recommendation}</span>
                                    </li>
                                  ),
                                )}
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
        </>
      )}
    </div>
  );
}
