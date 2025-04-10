'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  ChartContainer,
  Input,
  Progress,
} from '@/components/ui';
import {
  acosRatingGuide,
  calculateMetrics,
  chartConfig,
  getAcosColor,
  getAcosRating,
  type CampaignData,
} from '@/lib/acos-utils';
import {
  AlertCircle,
  Calculator,
  Download,
  FileText,
  Info,
  Upload,
} from 'lucide-react';
import Papa from 'papaparse';
import type React from 'react';
import { useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SampleCsvButton from './sample-csv-button';

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<
    'acos' | 'roas' | 'ctr' | 'cpc'
  >('acos');
  const [manualCampaignData, setManualCampaignData] = useState({
    campaignName: '',
    adSpend: '',
    sales: '',
  });

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
          const processedData: CampaignData[] = result.data
            .filter(
              (item) =>
                item.campaign &&
                !isNaN(Number(item.adSpend)) &&
                !isNaN(Number(item.sales)),
            )
            .map((item) => ({
              campaign: String(item.campaign),
              adSpend: Number(item.adSpend),
              sales: Number(item.sales),
              impressions: item.impressions
                ? Number(item.impressions)
                : undefined,
              clicks: item.clicks ? Number(item.clicks) : undefined,
              ...calculateMetrics({
                adSpend: Number(item.adSpend),
                sales: Number(item.sales),
                impressions: item.impressions
                  ? Number(item.impressions)
                  : undefined,
                clicks: item.clicks ? Number(item.clicks) : undefined,
              }),
            }));

          if (processedData.length === 0) {
            setError(
              'No valid data found in CSV. Please ensure your CSV has columns: campaign, adSpend, sales',
            );
            setIsLoading(false);
            return;
          }

          setCampaigns(processedData);
        } catch (err) {
          setError(
            `Failed to process CSV data: ${err instanceof Error ? err.message : String(err)}. Please ensure your CSV has the correct format`,
          );
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        setError(`Error parsing CSV file: ${error.message}`);
        setIsLoading(false);
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualCalculate = () => {
    if (!manualCampaign.campaign.trim()) {
      setError('Please enter a campaign name');
      return;
    }
    if (!manualCampaign.adSpend) {
      setError('Please enter ad spend amount');
      return;
    }
    if (!manualCampaign.sales) {
      setError('Please enter sales amount');
      return;
    }

    const adSpend = Number.parseFloat(manualCampaign.adSpend);
    const sales = Number.parseFloat(manualCampaign.sales);

    if (isNaN(adSpend) || adSpend < 0) {
      setError('Ad Spend must be a valid positive number');
      return;
    }

    const newACOSCampaign = {
      campaign: manualCampaignData.campaign,
      adSpend,
      sales,
      ...calculateMetrics({ adSpend, sales }),
    };

    setCampaigns([...campaigns, newACOSCampaign]);
    setManualCampaignData({
      campaignName: '',
      adSpend: '',
      sales: '',
    });
    setError(null);

    const manualCampaignData = {
      campaign: manualCampaign.campaign,
      adSpend,
      sales,
      ...calculateMetrics({ adSpend, sales }),
    };

    setCampaigns([...campaigns, newACOSCampaign]);
    setManualCampaignData({
      campaignName: '',
      adSpend: '',
      sales: '',
    });
    setError(null);
    if (isNaN(sales) || sales < 0) {
      setError('Sales amount must be a valid positive number');
      return;
    }
    if (sales === 0) {
      setError(
        'Sales amount cannot be zero as it would result in invalid ACOS calculation',
      );
      return;
    }

    const metrics = calculateMetrics({ adSpend, sales });
    const newACOSCampaign: CampaignData = {
      campaign: manualCampaignData.campaign,
      adSpend,
      sales,
      ...metrics,
    };

    setCampaigns([...campaigns, newCampaign]);
    setManualCampaign({ campaign: '', adSpend: '', sales: '' });
    setError(null);
  };

  const handleExport = () => {
    if (campaigns.length === 0) {
      setError('No data to export');
      return;
    }

    const exportData = campaigns.map((campaign) => ({
      campaign: campaign.campaign,
      adSpend: campaign.adSpend.toFixed(2),
      sales: campaign.sales.toFixed(2),
      acos: campaign.acos?.toFixed(2),
      roas: campaign.roas?.toFixed(2),
      impressions: campaign.impressions || '',
      clicks: campaign.clicks || '',
      ctr: campaign.ctr?.toFixed(2) || '',
      cpc: campaign.cpc?.toFixed(2) || '',
      conversionRate: campaign.conversionRate?.toFixed(2) || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'acos_calculations.csv');
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <SampleCsvButton
          dataType="acos"
          fileName="sample-acos-calculator.csv"
        />
        <Button
          variant="outline"
          onClick={handleExport}
          className="w-full sm:w-auto"
          disabled={campaigns.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
        <div className="flex gap-2">
          {Object.entries(chartConfig).map(([key, config]) => (
            <Button
              key={key}
              variant={selectedMetric === key ? 'default' : 'outline'}
              onClick={() => setSelectedMetric(key as typeof selectedMetric)}
              className="w-full sm:w-auto"
            >
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartContainer config={chartConfig} className="h-[400px]">
          {(width: number, height: number): React.ReactElement => (
            <BarChart width={width} height={height} data={campaigns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaign" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={selectedMetric}
                name={chartConfig[selectedMetric].label}
                fill={chartConfig[selectedMetric].theme.light}
              />
            </BarChart>
          )}
        </ChartContainer>

        <ChartContainer
          config={{
            acos: {
              label: 'ACOS Trend',
              theme: { light: '#ef4444', dark: '#ef4444' },
            },
            roas: {
              label: 'ROAS Trend',
              theme: { light: '#10b981', dark: '#10b981' },
            },
          }}
          className="h-[400px]"
        >
          {(width: number, height: number): React.ReactElement => (
            <LineChart width={width} height={height} data={campaigns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="campaign" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="acos"
                name="ACoS (%)"
                stroke="#ef4444"
              />
              <Line
                type="monotone"
                dataKey="roas"
                name="ROAS"
                stroke="#10b981"
              />
            </LineChart>
          )}
        </ChartContainer>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Your CSV file should have the following columns:{' '}
            <code>campaign</code>, <code>adSpend</code>, <code>sales</code>
          </p>
          <p>
            Optional columns: <code>impressions</code>, <code>clicks</code>
          </p>
          <p className="mt-1">
            Example: <code>campaign,adSpend,sales,impressions,clicks</code>
            <br />
            <code>
              Auto Campaign - Wireless Earbuds,245.67,1245.89,12450,320
            </code>
          </p>
        </div>
      </div>

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
                  Upload a CSV file with your campaign data
                </p>
              </div>
              <div className="w-full">
                <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
                  <FileText className="mb-2 h-8 w-8 text-primary/60" />
                  <span className="text-sm font-medium">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (CSV with campaign name, ad spend, and sales)
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
                    dataType="acos"
                    fileName="sample-acos-calculator.csv"
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

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-4 p-2">
              <h3 className="text-lg font-medium">Manual Calculator</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Campaign Name</label>
                  <Input
                    value={manualCampaign.campaign}
                    onChange={(e) =>
                      setManualCampaign({
                        ...manualCampaign,
                        campaign: e.target.value,
                      })
                    }
                    placeholder="Enter campaign name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ad Spend ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualCampaign.adSpend}
                    onChange={(e) =>
                      setManualCampaign({
                        ...manualCampaign,
                        adSpend: e.target.value,
                      })
                    }
                    placeholder="Enter ad spend amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Sales ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={manualCampaign.sales}
                    onChange={(e) =>
                      setManualCampaign({
                        ...manualCampaign,
                        sales: e.target.value,
                      })
                    }
                    placeholder="Enter sales amount"
                  />
                </div>
                <Button onClick={handleManualCalculate} className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate ACoS
                </Button>
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
            Processing your data...
          </p>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Campaign
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Ad Spend
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Sales
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    ACoS
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    ROAS
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 text-sm">{campaign.campaign}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      ${campaign.adSpend.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      ${campaign.sales.toFixed(2)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-medium ${getAcosColor(campaign.acos || 0)}`}
                    >
                      {campaign.acos?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {campaign.roas?.toFixed(2)}x
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          campaign.acos && campaign.acos < 25
                            ? 'default'
                            : campaign.acos && campaign.acos < 35
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {getAcosRating(campaign.acos || 0)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <h3 className="mb-2 text-sm font-medium">
            ACoS Interpretation Guide
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
            {acosRatingGuide.map((rating) => (
              <div
                key={rating.label}
                className="rounded-lg border bg-background p-2 text-center"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {rating.label}
                </div>
                <div className={rating.color}>{rating.range}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
