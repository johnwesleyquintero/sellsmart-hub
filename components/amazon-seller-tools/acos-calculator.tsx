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
  X,
} from 'lucide-react';
import Papa from 'papaparse';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone'; // Import useDropzone
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

  const fileInputRef = useRef<HTMLInputElement>(null); // Keep ref for potential programmatic trigger if needed elsewhere

  // Memoized check for valid manual input
  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum >= 0 &&
      !isNaN(salesNum) &&
      salesNum > 0 // Sales must be greater than 0 for ACoS/ROAS calculation
    );
  }, [manualCampaign]);

  const processParsedCsvData = useCallback((parsedData: CampaignData[]) => {
    const processedData: CampaignData[] = parsedData
      .filter(
        (item) =>
          item.campaign && // Ensure campaign name exists
          item.adSpend !== undefined &&
          !isNaN(Number(item.adSpend)) &&
          Number(item.adSpend) >= 0 && // Ad spend cannot be negative
          item.sales !== undefined &&
          !isNaN(Number(item.sales)) &&
          Number(item.sales) >= 0, // Sales can be zero, handle below
      )
      .map((item) => {
        const adSpend = Number(item.adSpend);
        const sales = Number(item.sales);
        // Safely parse optional fields
        const impressions = item.impressions ? Number(item.impressions) : undefined;
        const clicks = item.clicks ? Number(item.clicks) : undefined;

        // Handle zero sales case explicitly for metrics calculation
        if (sales === 0) {
          console.warn(
            `Campaign "${item.campaign}" has zero sales. ACoS will be infinite, ROAS will be 0.`,
          );
          // Calculate CTR/CPC if possible, even with zero sales
          const ctr = clicks && impressions && impressions > 0 ? (clicks / impressions) * 100 : 0;
          const cpc = clicks && clicks > 0 ? adSpend / clicks : 0;
          const conversionRate = 0; // Conversion rate is 0 if sales are 0

          return {
            campaign: String(item.campaign),
            adSpend,
            sales,
            impressions,
            clicks,
            acos: Infinity, // Represent infinite ACoS
            roas: 0,
            ctr,
            cpc,
            conversionRate,
          };
        }

        // Calculate all metrics if sales > 0
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
        'No valid campaign data found in CSV. Please ensure your CSV has columns: campaign, adSpend, sales (and optionally impressions, clicks) with valid numeric values.',
      );
    }
    return processedData;
  }, []);

  // Centralized file processing logic for react-dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]; // Process only the first file
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
            `Error parsing CSV file: ${result.errors[0].message}. Please check the format.`,
          );
          return;
        }

        // Validate required headers
        const requiredHeaders = ['campaign', 'adSpend', 'sales'];
        const actualHeaders = result.meta.fields || [];
        const missingHeaders = requiredHeaders.filter(
          (header) => !actualHeaders.includes(header),
        );

        if (missingHeaders.length > 0) {
          setError(
            `Missing required columns in CSV: ${missingHeaders.join(', ')}. Please include campaign, adSpend, and sales.`,
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
  }, [processParsedCsvData]); // Add dependency

  // Setup react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] }, // Specify accepted file type
    multiple: false, // Accept only one file
    disabled: isLoading,
  });

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
    // Resetting file input value is handled implicitly by react-dropzone not holding the file state
  }, []); // No dependencies needed

  // Handle manual input changes
  const handleManualInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow only numbers and a single decimal for numeric fields
    if (name === 'adSpend' || name === 'sales') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setManualCampaign(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setManualCampaign(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Sample CSV Button is now part of the Upload Card */}
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
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-medium mr-2 self-center">View Metric:</span>
        {Object.entries(chartConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedMetric === key ? 'default' : 'outline'}
            size="sm" // Smaller buttons for selection
            onClick={() => setSelectedMetric(key as typeof selectedMetric)}
            disabled={isLoading || campaigns.length === 0} // Disable if no data
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
                      domain={['auto', 'auto']} // Ensure Y-axis scales appropriately
                    />
                    <Tooltip
                      formatter={(value: number | string, name: string, props) => {
                        // Handle Infinity ACoS in tooltip
                        if (props.dataKey === 'acos' && value === Infinity) {
                          return ['Infinite', chartConfig.acos.label];
                        }
                        if (typeof value === 'number') {
                          return [`${value.toFixed(2)}${chartConfig[selectedMetric].label.includes('%') ? '%' : ''}`, chartConfig[selectedMetric].label];
                        }
                        return [value, chartConfig[selectedMetric].label];
                      }}
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
                  <LineChart data={campaigns} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="campaign"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                      interval={0}
                    />
                    {/* Left Y-Axis for ACoS */}
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      stroke={chartConfig.acos.theme.light}
                      label={{ value: 'ACoS (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: chartConfig.acos.theme.light } }}
                      tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
                      domain={[0, 'auto']} // Start ACoS from 0
                    />
                    {/* Right Y-Axis for ROAS */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={chartConfig.roas.theme.light}
                      label={{ value: 'ROAS', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: chartConfig.roas.theme.light } }}
                      tickFormatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
                      domain={[0, 'auto']} // Start ROAS from 0
                    />
                    <Tooltip
                      formatter={(value: number | string, name: string) => {
                        // Handle Infinity ACoS in tooltip
                        if (name.includes('ACoS') && value === Infinity) {
                          return ['Infinite', name];
                        }
                        if (typeof value === 'number') {
                          return [`${value.toFixed(2)}${name.includes('ACoS') ? '%' : 'x'}`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="acos"
                      name="ACoS (%)"
                      stroke={chartConfig.acos.theme.light}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false} // Don't connect points if data is missing
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="roas"
                      name="ROAS (x)"
                      stroke={chartConfig.roas.theme.light}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls={false}
                    />
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
            <li>Ensure <code>adSpend</code> and <code>sales</code> are numeric (>= 0).</li>
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
              {/* Dropzone Area */}
              <div
                {...getRootProps()}
                className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5 ${isDragActive ? 'border-primary bg-primary/10' : ''}`}
              >
                <input {...getInputProps()} ref={fileInputRef} />
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  {isDragActive ? 'Drop CSV file here...' : 'Click or drag CSV file here'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Requires: campaign, adSpend, sales)
                </span>
              </div>
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
            <form onSubmit={(e) => { e.preventDefault(); handleManualCalculate(); }} className="space-y-4">
              <div>
                <Label htmlFor="manual-campaign" className="text-sm font-medium">Campaign Name</Label>
                <Input
                  id="manual-campaign"
                  name="campaign" // Match state key
                  value={manualCampaign.campaign}
                  onChange={handleManualInputChange}
                  placeholder="Enter campaign name"
                  disabled={isLoading}
                  required // Basic HTML validation
                />
              </div>
              <div>
                <Label htmlFor="manual-adSpend" className="text-sm font-medium">Ad Spend ($)</Label>
                <Input
                  id="manual-adSpend"
                  name="adSpend" // Match state key
                  type="text" // Use text to allow better control over input format
                  inputMode="decimal" // Hint for mobile keyboards
                  value={manualCampaign.adSpend}
                  onChange={handleManualInputChange}
                  placeholder="e.g., 150.50"
                  disabled={isLoading}
                  required
                  min="0" // HTML validation
                  step="0.01" // HTML validation
                />
              </div>
              <div>
                <Label htmlFor="manual-sales" className="text-sm font-medium">Sales ($)</Label>
                <Input
                  id="manual-sales"
                  name="sales" // Match state key
                  type="text" // Use text for better control
                  inputMode="decimal"
                  value={manualCampaign.sales}
                  onChange={handleManualInputChange}
                  placeholder="e.g., 750.25"
                  disabled={isLoading}
                  required
                  min="0.01" // HTML validation (must be > 0 for ACoS)
                  step="0.01"
                />
              </div>
              <Button
                type="submit" // Use form submission
                className="w-full"
                disabled={!isManualInputValid || isLoading}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate & Add
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-grow break-words">{error}</span> {/* Allow error message to wrap */}
          <Button variant="ghost" size="icon" onClick={() => setError(null)} className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss error</span>
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" /> {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">
            Processing data...
          </p>
        </div>
      )}

      {/* Results Table */}
      {campaigns.length > 0 && !isLoading && (
        <Card>
          <CardContent className="p-0"> {/* Remove padding for full-width table */}
            <h3 className="text-lg font-semibold p-4 border-b">Calculation Results ({campaigns.length} Campaigns)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Campaign</th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Ad Spend</th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Sales</th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">ACoS</th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">ROAS</th>
                    <th className="px-4 py-3 text-center font-medium whitespace-nowrap">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => (
                    <tr key={`${campaign.campaign}-${index}`} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
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
