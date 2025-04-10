'use client';

import {
  Badge,
  Button,
  Card,
  CardContent,
  ChartContainer,
  Input,
  Label,
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
  X, // Added X icon for clear button
} from 'lucide-react';
import Papa from 'papaparse';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SampleCsvButton from './sample-csv-button';

// Type for the manual input form state
type ManualCampaignInput = {
  campaign: string;
  adSpend: string;
  sales: string;
};

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<
    'acos' | 'roas' | 'ctr' | 'cpc'
  >('acos');

  // State for manual input form
  const [manualCampaign, setManualCampaign] = useState<ManualCampaignInput>({
    campaign: '',
    adSpend: '',
    sales: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized check for valid manual input
  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum >= 0 &&
      !isNaN(salesNum) &&
      salesNum > 0 // Sales must be greater than 0 for ACoS calculation
    );
  }, [manualCampaign]);

  const processParsedCsvData = useCallback((parsedData: CampaignData[]) => {
    const processedData: CampaignData[] = parsedData
      .filter(
        (item) =>
          item.campaign &&
          item.adSpend !== undefined &&
          !isNaN(Number(item.adSpend)) &&
          item.sales !== undefined &&
          !isNaN(Number(item.sales)),
      )
      .map((item) => {
        const adSpend = Number(item.adSpend);
        const sales = Number(item.sales);
        const impressions = item.impressions ? Number(item.impressions) : undefined;
        const clicks = item.clicks ? Number(item.clicks) : undefined;

        // Ensure sales is not zero before calculating metrics that depend on it
        if (sales === 0) {
          console.warn(`Campaign "${item.campaign}" has zero sales. ACoS/ROAS will be infinite/zero.`);
          // Handle zero sales case - ACoS is technically infinite, ROAS is 0
          return {
            campaign: String(item.campaign),
            adSpend,
            sales,
            impressions,
            clicks,
            acos: Infinity, // Represent infinite ACoS
            roas: 0,
            ctr: clicks && impressions ? (clicks / impressions) * 100 : 0,
            cpc: clicks ? adSpend / clicks : 0,
            conversionRate: clicks ? (sales / clicks) * 100 : 0, // Or based on orders if available
          };
        }

        return {
          campaign: String(item.campaign),
          adSpend,
          sales,
          impressions,
          clicks,
          ...calculateMetrics({
            adSpend,
            sales,
            impressions,
            clicks,
          }),
        };
      });

    if (processedData.length === 0) {
      throw new Error(
        'No valid data found in CSV. Please ensure your CSV has columns: campaign, adSpend, sales (and optionally impressions, clicks)',
      );
    }
    return processedData;
  }, []);


  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null); // Clear previous errors

    Papa.parse<CampaignData>(file, {
      header: true,
      dynamicTyping: true, // Automatically convert numbers
      skipEmptyLines: true,
      complete: (result) => {
        setIsLoading(false); // Ensure loading stops
        if (result.errors.length > 0) {
          setError(
            `Error parsing CSV file: ${result.errors[0].message}. Please check the format and ensure headers (campaign, adSpend, sales) are correct.`,
          );
          return;
        }

        try {
          const processedData = processParsedCsvData(result.data);
          setCampaigns(processedData);
        } catch (err) {
          setError(
            `Failed to process CSV data: ${err instanceof Error ? err.message : String(err)}.`,
          );
        }
      },
      error: (error) => {
        setIsLoading(false); // Ensure loading stops
        setError(`Error parsing CSV file: ${error.message}`);
      },
    });

    // Reset file input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processParsedCsvData]); // Add dependency


  const handleManualCalculate = useCallback(() => {
    setError(null); // Clear previous errors

    if (!isManualInputValid) {
      // Determine specific error message
      if (!manualCampaign.campaign.trim()) {
        setError('Please enter a campaign name.');
      } else if (isNaN(Number.parseFloat(manualCampaign.adSpend)) || Number.parseFloat(manualCampaign.adSpend) < 0) {
        setError('Ad Spend must be a valid non-negative number.');
      } else if (isNaN(Number.parseFloat(manualCampaign.sales)) || Number.parseFloat(manualCampaign.sales) <= 0) {
        setError('Sales amount must be a valid positive number (cannot be zero or negative).');
      } else {
        setError('Please ensure all fields are filled correctly.');
      }
      return;
    }

    const adSpend = Number.parseFloat(manualCampaign.adSpend);
    const sales = Number.parseFloat(manualCampaign.sales);

    // Calculate metrics using the utility function
    const metrics = calculateMetrics({ adSpend, sales });

    const newCampaign: CampaignData = {
      campaign: manualCampaign.campaign.trim(),
      adSpend,
      sales,
      ...metrics,
    };

    setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
    // Reset the form
    setManualCampaign({ campaign: '', adSpend: '', sales: '' });

  }, [manualCampaign, isManualInputValid]); // Add dependencies


  const handleExport = useCallback(() => {
    if (campaigns.length === 0) {
      setError('No data to export.');
      return;
    }
    setError(null); // Clear previous errors

    const exportData = campaigns.map((campaign) => ({
      campaign: campaign.campaign,
      adSpend: campaign.adSpend.toFixed(2),
      sales: campaign.sales.toFixed(2),
      acos: campaign.acos === Infinity ? 'Infinity' : campaign.acos?.toFixed(2) ?? '',
      roas: campaign.roas?.toFixed(2) ?? '',
      impressions: campaign.impressions ?? '',
      clicks: campaign.clicks ?? '',
      ctr: campaign.ctr?.toFixed(2) ?? '',
      cpc: campaign.cpc?.toFixed(2) ?? '',
      conversionRate: campaign.conversionRate?.toFixed(2) ?? '',
    }));

    try {
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'acos_calculations.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up blob URL
    } catch (err) {
      setError(`Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [campaigns]); // Add dependency

  const clearData = useCallback(() => {
    setCampaigns([]);
    setError(null);
    setManualCampaign({ campaign: '', adSpend: '', sales: '' }); // Also clear manual form
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []); // No dependencies needed

  // Handle manual input changes
  const handleManualInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualCampaign(prev => ({ ...prev, [name]: value }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Uploading...' : 'Upload CSV'}
        </Button>
        <input
          id="upload-csv"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
        <SampleCsvButton
          dataType="acos"
          fileName="sample-acos-calculator.csv"
        />
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={campaigns.length === 0 || isLoading}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
        {campaigns.length > 0 && (
          <Button
            variant="destructive"
            onClick={clearData}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Clear Data
          </Button>
        )}
      </div>

      {/* Metric Selection Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm font-medium mr-2 self-center">View Metric:</span>
        {Object.entries(chartConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedMetric === key ? 'default' : 'outline'}
            size="sm" // Smaller buttons for selection
            onClick={() => setSelectedMetric(key as typeof selectedMetric)}
            disabled={isLoading}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Charts Row */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">{chartConfig[selectedMetric].label} Distribution</h3>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer>
                  <BarChart data={campaigns} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="campaign"
                      tick={{ fontSize: 10 }}
                      angle={-30} // Angle ticks for better readability if many campaigns
                      textAnchor="end"
                      height={50} // Adjust height for angled ticks
                      interval={0} // Show all ticks
                    />
                    <YAxis
                      label={{ value: chartConfig[selectedMetric].label, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                      tickFormatter={(value) => typeof value === 'number' ? value.toFixed(chartConfig[selectedMetric].label.includes('%') ? 1 : 0) : value}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        `${value.toFixed(2)}${chartConfig[selectedMetric].label.includes('%') ? '%' : ''}`
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey={selectedMetric}
                      name={chartConfig[selectedMetric].label}
                      fill={chartConfig[selectedMetric].theme.light}
                      radius={[4, 4, 0, 0]} // Rounded top corners
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Line Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">ACoS vs ROAS Trend</h3>
              <ChartContainer config={{ /* Config specific to this chart if needed */ }} className="h-[400px] w-full">
                <ResponsiveContainer>
                  <LineChart data={campaigns} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="campaign"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    <YAxis yAxisId="left" orientation="left" stroke="#ef4444" label={{ value: 'ACoS (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#ef4444' } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'ROAS', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#10b981' } }} />
                    <Tooltip formatter={(value: number, name: string) => [`${value.toFixed(2)}${name.includes('ACoS') ? '%' : 'x'}`, name]} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="acos" name="ACoS (%)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
                    <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS (x)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Required columns: <code>campaign</code>, <code>adSpend</code>, <code>sales</code></li>
            <li>Optional columns: <code>impressions</code>, <code>clicks</code></li>
            <li>Ensure <code>adSpend</code> and <code>sales</code> are numeric.</li>
            <li>Example Row: <code>My Campaign,150.50,750.25,10000,200</code></li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload Campaign Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV file with campaign details
                </p>
              </div>
              {/* Dropzone-like area */}
              <label className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5 transition-colors">
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  Click to select CSV file
                </span>
                <span className="text-xs text-muted-foreground">
                  (Or drag and drop)
                </span>
                {/* Hidden input is linked via the main action button now */}
              </label>
              <div className="flex justify-center mt-4">
                <SampleCsvButton
                  dataType="acos"
                  fileName="sample-acos-calculator.csv"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Calculator Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Manual Calculator</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="manual-campaign" className="text-sm font-medium">Campaign Name</Label>
                <Input
                  id="manual-campaign"
                  name="campaign" // Match state key
                  value={manualCampaign.campaign}
                  onChange={handleManualInputChange}
                  placeholder="Enter campaign name"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="manual-adSpend" className="text-sm font-medium">Ad Spend ($)</Label>
                <Input
                  id="manual-adSpend"
                  name="adSpend" // Match state key
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualCampaign.adSpend}
                  onChange={handleManualInputChange}
                  placeholder="e.g., 150.50"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="manual-sales" className="text-sm font-medium">Sales ($)</Label>
                <Input
                  id="manual-sales"
                  name="sales" // Match state key
                  type="number"
                  min="0.01" // Sales must be positive for ACoS
                  step="0.01"
                  value={manualCampaign.sales}
                  onChange={handleManualInputChange}
                  placeholder="e.g., 750.25"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleManualCalculate}
                className="w-full"
                disabled={!isManualInputValid || isLoading}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate & Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-grow">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-800 dark:text-red-400">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress className="h-2 w-1/2 mx-auto" /> {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">
            Processing data...
          </p>
        </div>
      )}

      {/* Results Table */}
      {campaigns.length > 0 && !isLoading && (
        <Card>
          <CardContent className="p-0"> {/* Remove padding for full-width table */}
            <h3 className="text-lg font-semibold p-4 border-b">Calculation Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium">Campaign</th>
                    <th className="px-4 py-3 text-right font-medium">Ad Spend</th>
                    <th className="px-4 py-3 text-right font-medium">Sales</th>
                    <th className="px-4 py-3 text-right font-medium">ACoS</th>
                    <th className="px-4 py-3 text-right font-medium">ROAS</th>
                    <th className="px-4 py-3 text-center font-medium">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => (
                    <tr key={index} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{campaign.campaign}</td>
                      <td className="px-4 py-3 text-right">${campaign.adSpend.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${campaign.sales.toFixed(2)}</td>
                      <td
                        className={`px-4 py-3 text-right font-medium ${getAcosColor(campaign.acos)}`}
                      >
                        {campaign.acos === Infinity ? '∞' : campaign.acos?.toFixed(2) + '%' ?? 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {campaign.roas?.toFixed(2)}x
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            campaign.acos === Infinity ? 'destructive' :
                            campaign.acos === undefined ? 'outline' :
                            campaign.acos < 25 ? 'default' :
                            campaign.acos < 35 ? 'secondary' : 'destructive'
                          }
                          className="whitespace-nowrap"
                        >
                          {getAcosRating(campaign.acos)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACoS Guide */}
      {campaigns.length > 0 && !isLoading && (
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-medium">ACoS Interpretation Guide</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {acosRatingGuide.map((rating) => (
                <div
                  key={rating.label}
                  className="rounded-lg border bg-background p-2 text-center shadow-sm"
                >
                  <div className={`text-xs font-semibold ${rating.color}`}>
                    {rating.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{rating.range}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
