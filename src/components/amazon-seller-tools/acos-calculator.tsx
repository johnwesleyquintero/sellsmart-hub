'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  CardContent,
  ChartContainer,
  Input,
  Label,
  Progress,
} from '@/components/ui';
import { MetricKey } from '@/lib/amazon-tools/types';
import { getAcosRating } from '@/lib/calculations/acos-utils';
import {
  campaignHeaders,
  validateCampaignRow,
} from '@/lib/hooks/use-campaign-validator';
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import {
  AlertCircle,
  Calculator,
  Download,
  FileText,
  Info,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
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
import DataCard from './DataCard';
import SampleCsvButton from './sample-csv-button';

// --- Interfaces & Types ---

export interface CampaignData {
  campaign: string;
  adSpend: number;
  sales: number;
  impressions?: number;
  clicks?: number;
  acos?: number; // Calculated: (adSpend / sales) * 100
  roas?: number; // Calculated: sales / adSpend
  ctr?: number; // Calculated: (clicks / impressions) * 100
  cpc?: number; // Calculated: adSpend / clicks
  conversionRate?: number; // Calculated: (sales / clicks) * 100 (or based on orders if available)
}

// --- Constants ---

const acosRatingGuide = [
  { label: 'Excellent', range: '< 15%', color: 'text-green-500' },
  { label: 'Good', range: '15-25%', color: 'text-blue-500' },
  { label: 'Fair', range: '25-35%', color: 'text-yellow-500' },
  { label: 'Poor', range: '> 35%', color: 'text-red-500' },
];

// Configuration for charts (using const assertion for stricter typing)
const chartConfig = {
  acos: { label: 'ACoS (%)', theme: { light: '#8884d8', dark: '#8884d8' } },
  roas: { label: 'ROAS (x)', theme: { light: '#82ca9d', dark: '#82ca9d' } },
  ctr: { label: 'CTR (%)', theme: { light: '#ffc658', dark: '#ffc658' } },
  cpc: { label: 'CPC ($)', theme: { light: '#ff7300', dark: '#ff7300' } },
  conversionRate: {
    label: 'Conv. Rate (%)',
    theme: { light: '#ff8042', dark: '#ff8042' },
  }, // Added Conversion Rate
} as const satisfies {
  [key in MetricKey | 'conversionRate']: {
    label: string;
    theme: { light: string; dark: string };
  };
};

// --- Helper Functions ---

// Define a constant for the red color
const RED_COLOR = 'text-red-500';

// --- Constants ---

function getAcosColor(acos: number): string {
  if (!isFinite(acos)) return RED_COLOR; // Handle Infinity
  if (acos < 15) return 'text-green-500';
  if (acos < 25) return 'text-blue-500';
  if (acos < 35) return 'text-yellow-500';
  return RED_COLOR;
}

// Moved calculation logic here for better organization within the file
const calculateLocalMetrics = (
  adSpend: number,
  sales: number,
  impressions?: number,
  clicks?: number,
): Omit<
  CampaignData,
  'campaign' | 'adSpend' | 'sales' | 'impressions' | 'clicks'
> => {
  // Handle zero or negative sales, and zero adSpend edge cases
  const acos = sales > 0 ? (adSpend / sales) * 100 : Infinity;
  const calculateROAS = () => {
    if (adSpend > 0) {
      return sales / adSpend;
    }
    if (sales > 0) {
      return Infinity;
    }
    return 0;
  };
  const roas = calculateROAS();

  const safeImpressions = impressions && impressions > 0 ? impressions : 0;
  const safeClicks = clicks && clicks > 0 ? clicks : 0;

  const ctr = safeImpressions > 0 ? (safeClicks / safeImpressions) * 100 : 0;
  const cpc = safeClicks > 0 ? adSpend / safeClicks : 0;
  // Assuming 'sales' represents revenue. If it represents orders, this calculation is correct.
  // If 'sales' is revenue, conversion rate calculation needs # of orders.
  // Using clicks as a proxy if orders aren't available.
  const calculateConversionRate = () => {
    if (safeClicks > 0) {
      // If sales represent revenue, this is Revenue Per Click * 100, not true Conversion Rate.
      // For true Conversion Rate (Orders/Clicks), you'd need the number of orders.
      return (sales / safeClicks) * 100;
    }
    return 0;
  };
  const conversionRate = calculateConversionRate();

  return { acos, roas, ctr, cpc, conversionRate };
};

// --- Component ---

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof chartConfig>('acos');

  // State for manual input form
  const [manualCampaign, setManualCampaign] = useState({
    campaign: '',
    adSpend: '',
    sales: '',
  });

  // Memoized check for valid manual input
  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum >= 0 &&
      !isNaN(salesNum) &&
      salesNum >= 0 // Allow zero sales, ACoS will be Infinity
    );
  }, [manualCampaign]);

  // Removed unused processParsedCsvData function

  // Use the CSV parser hook
  const csvParser = useCsvParser<CampaignData>({
    requiredHeaders: campaignHeaders.required,
    validateRow: validateCampaignRow,
  });

  // Centralized file processing logic for react-dropzone
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]; // Process only the first file
      if (!file) return;

      try {
        const result = await csvParser.parseFile(file);
        setCampaigns(result.data);

        // Show warning if some rows were skipped
        if (result.skippedRows.length > 0) {
          setError(
            `Processed with warnings: ${result.skippedRows.length} rows were skipped due to invalid data.`,
          );
        } else {
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [csvParser],
  );

  // Setup react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] }, // Specify accepted file type
    multiple: false, // Accept only one file
    disabled: isLoading,
  });

  // Handle manual input changes with debounced validation
  const handleManualInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      // Sanitize input based on field type
      let sanitizedValue = value;
      if (name === 'adSpend' || name === 'sales') {
        // Remove non-numeric characters except decimal point and ensure only one decimal point
        sanitizedValue = value
          .replace(/[^\d.]/g, '') // Allow only digits and dot
          .replace(/(\..*)\./g, '$1') // Allow only one dot
          .replace(/^\./, '0.') // Prepend 0 if starts with dot
          .replace(/^0+(?=\d)/, ''); // Remove leading zeros unless it's the only digit before dot

        // Removed the slow regex validation check here
      } else if (name === 'campaign') {
        // Trim whitespace and limit length for campaign name
        sanitizedValue = value.trimStart().slice(0, 100); // Trim only start to allow spaces within name
      }

      setManualCampaign((prev) => ({ ...prev, [name]: sanitizedValue }));
      setError(null); // Clear error when user starts typing
    },
    [],
  );

  const handleManualCalculate = useCallback(() => {
    setError(null); // Clear previous errors
    setIsLoading(true); // Show loading state during calculation

    try {
      if (!isManualInputValid) {
        // Enhanced validation with specific error messages
        if (!manualCampaign.campaign.trim()) {
          throw new Error('Please enter a campaign name.');
        }

        const adSpend = Number.parseFloat(manualCampaign.adSpend);
        if (isNaN(adSpend) || adSpend < 0) {
          throw new Error('Ad Spend must be a valid non-negative number.');
        }

        const sales = Number.parseFloat(manualCampaign.sales);
        if (isNaN(sales) || sales < 0) {
          throw new Error('Sales amount must be a valid non-negative number.');
        }

        // Additional validation for reasonable limits (optional)
        // if (adSpend > 1000000) {
        //   throw new Error('Ad Spend value seems unusually high. Please verify.');
        // }
        // if (sales > 10000000) {
        //   throw new Error('Sales value seems unusually high. Please verify.');
        // }
        // If it reaches here, it means the basic check passed but something else is wrong
        throw new Error('Invalid input. Please check values.');
      }

      const adSpend = Number.parseFloat(manualCampaign.adSpend);
      const sales = Number.parseFloat(manualCampaign.sales);

      // Calculate metrics using the utility function
      const metrics = calculateLocalMetrics(adSpend, sales); // Only pass required args

      const newCampaign: CampaignData = {
        campaign: manualCampaign.campaign.trim(),
        adSpend,
        sales,
        ...metrics,
      };

      setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
      // Reset the form
      setManualCampaign({ campaign: '', adSpend: '', sales: '' });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  }, [manualCampaign, isManualInputValid]);

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
      acos:
        campaign.acos === Infinity
          ? 'Infinity'
          : (campaign.acos?.toFixed(2) ?? ''), // Handle undefined
      roas:
        campaign.roas === Infinity
          ? 'Infinity'
          : (campaign.roas?.toFixed(2) ?? ''), // Handle undefined and Infinity
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
      setError(
        `Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [campaigns]);

  const clearData = useCallback(() => {
    setCampaigns([]);
    setError(null);
    setManualCampaign({ campaign: '', adSpend: '', sales: '' }); // Also clear manual form
  }, []);

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant={error.includes('warnings') ? 'default' : 'destructive'}>
          {' '}
          {/* Changed 'warning' to 'default' */}
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {error.includes('warnings') ? 'Warning' : 'Error'}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => setError(null)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </Alert>
      )}

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
        <span className="text-sm font-medium mr-2 self-center">
          View Metric:
        </span>
        {Object.entries(chartConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedMetric === key ? 'default' : 'outline'}
            size="sm" // Smaller buttons for selection
            onClick={() => {
              setSelectedMetric(key as keyof typeof chartConfig);
            }}
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
          <DataCard>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                {chartConfig[selectedMetric].label} Distribution
              </h3>
              {/* Ensure ChartContainer is correctly used or remove if not needed */}
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer>
                  <BarChart
                    data={campaigns}
                    margin={{ top: 5, right: 10, left: 20, bottom: 60 }} // Increased bottom margin
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="campaign"
                      tick={{ fontSize: 10 }}
                      angle={-45} // Angle ticks for better readability
                      textAnchor="end"
                      height={70} // Adjust height for angled ticks
                      interval={0} // Show all ticks
                    />
                    <YAxis
                      label={{
                        value: chartConfig[selectedMetric]?.label || 'Metric',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' },
                        dy: -10, // Adjust label position if needed
                      }}
                      tickFormatter={(value) => {
                        if (typeof value === 'number' && isFinite(value)) {
                          let decimals = 0;
                          if (chartConfig[selectedMetric].label.includes('%')) {
                            decimals = 1;
                          } else if (
                            chartConfig[selectedMetric].label.includes('($)')
                          ) {
                            decimals = 2;
                          }
                          return value.toFixed(decimals);
                        } else if (value === Infinity) {
                          return '∞';
                        } else {
                          return value;
                        }
                      }}
                      domain={['auto', 'auto']} // Ensure Y-axis scales appropriately
                    />
                    <Tooltip
                      formatter={(
                        value: number | string,
                        name: keyof typeof chartConfig,
                      ) => formatValue(value, name)}
                      labelFormatter={(label) => `Campaign: ${label || ''}`}
                    />

                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar
                      dataKey={selectedMetric}
                      name={chartConfig[selectedMetric]?.label || 'Metric'}
                      fill={chartConfig[selectedMetric].theme.light}
                      radius={[4, 4, 0, 0]} // Rounded top corners
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </DataCard>

          {/* Line Chart for ACoS vs ROAS Trend */}
          <DataCard>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                ACoS vs ROAS Trend
              </h3>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer>
                  <LineChart
                    data={campaigns}
                    margin={{ top: 5, right: 30, left: 30, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="campaign"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      interval={0}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      formatter={(
                        value: number | string,
                        name: keyof typeof chartConfig,
                      ) => formatValue(value, name)}
                      labelFormatter={(label) => `Campaign: ${label || ''}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="acos"
                      stroke="#8884d8"
                      name="ACoS (%)"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="roas"
                      stroke="#82ca9d"
                      name="ROAS (x)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </DataCard>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Required columns: <code>campaign</code>, <code>adSpend</code>,
              <code>sales</code>
            </li>
            <li>
              Optional columns: <code>impressions</code>, <code>clicks</code>
            </li>
            <li>
              Ensure <code>adSpend</code> and <code>sales</code> are numeric
              (&gt;= 0).
            </li>
            <li>
              Example Row:
              <code>
                My Campaign&comma;150.50&comma;750.25&comma;10000&comma;200
              </code>
            </li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <DataCard>
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
                <input {...getInputProps()} /> {/* Removed ref */}
                <FileText className="mb-2 h-8 w-8 text-primary/60" />
                <span className="text-sm font-medium">
                  {isDragActive
                    ? 'Drop CSV file here...'
                    : 'Click or drag CSV file here'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  (Requires: campaign, adSpend, sales)
                </span>
                <SampleCsvButton
                  dataType="acos"
                  fileName="sample-acos-calculator.csv"
                  className="mt-4"
                />
              </div>
            </div>
          </CardContent>
        </DataCard>

        {/* Manual Calculator Card */}
        <DataCard>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Manual Calculator</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleManualCalculate();
              }}
              className="space-y-4"
            >
              <div>
                <Label
                  htmlFor="manual-campaign"
                  className="text-sm font-medium"
                >
                  Campaign Name
                </Label>
                <Input
                  id="manual-campaign"
                  name="campaign" // Added name attribute
                  value={manualCampaign.campaign}
                  onChange={handleManualInputChange}
                  required
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="manual-adSpend" className="text-sm font-medium">
                  Ad Spend ($)
                </Label>
                <Input
                  id="manual-adSpend"
                  name="adSpend" // Added name attribute
                  type="text" // Use text for better control with regex
                  inputMode="decimal"
                  value={manualCampaign.adSpend}
                  onChange={handleManualInputChange}
                  placeholder="e.g., 150.50"
                  required
                  // Remove the pattern attribute since it's not supported by the Input component
                  // Validation is already handled in handleManualInputChange
                />
              </div>
              <div>
                <Label htmlFor="manual-sales" className="text-sm font-medium">
                  Sales ($)
                </Label>
                <Input
                  id="manual-sales"
                  name="sales"
                  type="text"
                  inputMode="decimal"
                  value={manualCampaign.sales}
                  onChange={handleManualInputChange}
                  required
                  placeholder="e.g., 750.25"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!isManualInputValid || isLoading}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate & Add
              </Button>
            </form>
          </CardContent>
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
            onClick={() => {
              setError(null);
            }}
            className="text-red-800 dark:text-red-400 h-6 w-6 flex-shrink-0"
            aria-label="Dismiss error" // Added aria-label
          >
            <XCircle className="h-4 w-4" /> {/* Changed to XCircle */}
            <span className="sr-only">Dismiss error</span>
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="space-y-2 py-4 text-center">
          <Progress value={undefined} className="h-2 w-1/2 mx-auto" />{' '}
          {/* Indeterminate */}
          <p className="text-sm text-muted-foreground">Processing data...</p>
        </div>
      )}

      {/* Results Table */}
      {campaigns.length > 0 && !isLoading && (
        <DataCard>
          <CardContent className="p-0">
            <h3 className="text-lg font-semibold p-4 border-b">
              Calculation Results ({campaigns.length} Campaigns)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Ad Spend
                    </th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      Sales
                    </th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      ACoS
                    </th>
                    <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      ROAS
                    </th>
                    <th className="px-4 py-3 text-center font-medium whitespace-nowrap">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign, index) => {
                    const acosValue = campaign.acos;
                    const roasValue = campaign.roas;
                    let acosDisplay = 'N/A';
                    if (acosValue === Infinity) {
                      acosDisplay = '∞';
                    } else if (acosValue !== undefined) {
                      acosDisplay = `${acosValue.toFixed(2)}%`;
                    }
                    let roasDisplay = 'N/A';
                    if (roasValue === Infinity) {
                      roasDisplay = '∞';
                    } else if (roasValue !== undefined) {
                      roasDisplay = `${roasValue.toFixed(2)}x`;
                    }
                    const rating = getAcosRating(acosValue ?? Infinity); // Use Infinity if undefined
                    const acosColor = getAcosColor(acosValue ?? Infinity);

                    let badgeVariant:
                      | 'default'
                      | 'secondary'
                      | 'destructive'
                      | 'outline' = 'outline';
                    if (rating === 'Excellent')
                      badgeVariant = 'default'; // Or 'success' if you have it
                    else if (rating === 'Good') badgeVariant = 'secondary';
                    else if (rating === 'Poor' || rating === 'Very Poor')
                      badgeVariant = 'destructive'; // Combined Poor/Very Poor

                    return (
                      <tr
                        key={`${campaign.campaign}-${index}`} // Use a combination for potential duplicate names
                        className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {campaign.campaign}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ${campaign.adSpend.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ${campaign.sales.toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-medium ${acosColor}`}
                        >
                          {acosDisplay}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {roasDisplay}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={badgeVariant}
                            className="whitespace-nowrap"
                          >
                            {rating}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </DataCard>
      )}

      {/* ACoS Guide */}
      {campaigns.length > 0 && !isLoading && (
        <DataCard className="bg-muted/20">
          <CardContent className="p-4">
            <h3 className="mb-2 text-sm font-medium">
              ACoS Interpretation Guide
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {' '}
              {/* Adjusted grid for 4 items */}
              {acosRatingGuide.map((rating) => (
                <div key={rating.label}>
                  {' '}
                  {/* Added key prop */}
                  <span className={`font-medium ${rating.color}`}>
                    {rating.label}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {rating.range}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </DataCard>
      )}
    </div>
  );
}

// Helper function to format tooltip values
const formatValue = (
  value: number | string,
  name: keyof typeof chartConfig,
): string => {
  if (typeof value === 'string') return value;
  if (!isFinite(value)) return '∞';

  let decimals = 0;
  let prefix = '';
  let suffix = ''; // Declare suffix once with let

  // Determine decimals and suffix based on metric type
  if (name === 'acos' || name === 'ctr' || name === 'conversionRate') {
    decimals = 1;
    suffix = '%';
  } else if (name === 'roas') {
    decimals = 2;
    suffix = 'x'; // ROAS is typically shown as a multiplier
  } else if (name === 'cpc') {
    decimals = 2;
    prefix = '$';
  }

  // Format the number
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
};
