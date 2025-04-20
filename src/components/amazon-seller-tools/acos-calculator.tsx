// Move 'use client' directive to the top of the file if not already present
'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
} from '@/components/ui';
import { MetricKey } from '@/lib/amazon-tools/types';
import {
  campaignHeaders,
  validateCampaignRow,
} from '@/lib/hooks/use-campaign-validator';
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import { AlertCircle, Download, Info, Upload, X, XCircle } from 'lucide-react';
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
// Import Recharts components
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
// Import ValueType for stricter Tooltip typing (optional but recommended)
// import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
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
  revenuePerClickRate?: number; // Calculated: (sales / clicks) * 100 (or based on orders if available)
}

// --- Constants ---

const acosRatingGuide = [
  { label: 'Excellent', range: '< 15%', color: 'text-green-500' },
  { label: 'Good', range: '15-25%', color: 'text-blue-500' },
  { label: 'Fair', range: '25-35%', color: 'text-yellow-500' },
  { label: 'Poor', range: '> 35%', color: 'text-red-500' },
];

const chartConfig = {
  acos: { label: 'ACoS (%)', theme: { light: '#8884d8', dark: '#8884d8' } },
  roas: { label: 'ROAS (x)', theme: { light: '#82ca9d', dark: '#82ca9d' } },
  ctr: { label: 'CTR (%)', theme: { light: '#ffc658', dark: '#ffc658' } },
  cpc: { label: 'CPC ($)', theme: { light: '#ff7300', dark: '#ff7300' } },
  revenuePerClickRate: {
    label: 'RPC Rate (%)',
    theme: { light: '#ff8042', dark: '#ff8042' },
  },
} as const satisfies {
  [key in MetricKey | 'revenuePerClickRate']: {
    label: string;
    theme: { light: string; dark: string };
  };
};

const RED_COLOR = 'text-red-500';

// --- Helper Functions ---

function getAcosColor(acos: number): string {
  if (!isFinite(acos)) return RED_COLOR;
  if (acos < 15) return 'text-green-500';
  if (acos < 25) return 'text-blue-500';
  if (acos < 35) return 'text-yellow-500';
  return RED_COLOR;
}

const calculateLocalMetrics = (
  adSpend: number,
  sales: number,
  impressions?: number,
  clicks?: number,
): Omit<
  CampaignData,
  'campaign' | 'adSpend' | 'sales' | 'impressions' | 'clicks'
> => {
  const acos = sales > 0 ? (adSpend / sales) * 100 : Infinity;
  const calculateROAS = () => {
    if (adSpend > 0) return sales / adSpend;
    if (sales > 0) return Infinity;
    return 0;
  };
  const roas = calculateROAS();
  const safeImpressions = impressions && impressions > 0 ? impressions : 0;
  const safeClicks = clicks && clicks > 0 ? clicks : 0;
  const ctr = safeImpressions > 0 ? (safeClicks / safeImpressions) * 100 : 0;
  const cpc = safeClicks > 0 ? adSpend / safeClicks : 0;
  const calculateConversionRate = () => {
    if (safeClicks > 0) return (sales / safeClicks) * 100;
    return 0;
  };
  const revenuePerClickRate = calculateConversionRate();
  return { acos, roas, ctr, cpc, revenuePerClickRate };
};

// --- Component ---

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof chartConfig>('acos');
  const [manualCampaign, setManualCampaign] = useState({
    campaign: '',
    adSpend: '',
    sales: '',
  });

  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum >= 0 &&
      !isNaN(salesNum) &&
      salesNum >= 0
    );
  }, [manualCampaign]);

  const csvParser = useCsvParser<CampaignData>(
    {
      requiredHeaders: campaignHeaders.required,
      validateRow: validateCampaignRow,
    },
    (error: Error) => {
      setError(`CSV Parsing Error: ${error.message}`);
      setIsLoading(false);
    },
    (result: {
      data: CampaignData[];
      skippedRows: Array<{ index: number; reason: string }>;
    }) => {
      const dataWithMetrics = result.data.map((row) => {
        const metrics = calculateLocalMetrics(
          row.adSpend,
          row.sales,
          row.impressions,
          row.clicks,
        );
        return { ...row, ...metrics };
      });
      setCampaigns(dataWithMetrics);
      setIsLoading(false);
      if (result.skippedRows.length > 0) {
        setError(
          `Processed with warnings: ${result.skippedRows.length} rows were skipped due to invalid data.`,
        );
      } else {
        setError(null);
      }
    },
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        setError('No file selected');
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        await csvParser.parseFile(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    },
    [csvParser],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: isLoading,
  });

  const handleManualInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let sanitizedValue = value;
      if (name === 'adSpend' || name === 'sales') {
        sanitizedValue = value
          .replace(/[^\d.]/g, '')
          .replace(/(\..*)\./g, '$1')
          .replace(/^\./, '0.')
          .replace(/^0+(?=\d)/, '');
      } else if (name === 'campaign') {
        sanitizedValue = value.trimStart().slice(0, 100);
      }
      setManualCampaign((prev) => ({ ...prev, [name]: sanitizedValue }));
      setError(null);
    },
    [],
  );

  const handleManualCalculate = useCallback(() => {
    setError(null);
    setIsLoading(true);
    try {
      if (!isManualInputValid) {
        if (!manualCampaign.campaign.trim())
          throw new Error('Please enter a campaign name.');
        const adSpend = Number.parseFloat(manualCampaign.adSpend);
        if (isNaN(adSpend) || adSpend < 0)
          throw new Error('Ad Spend must be a valid non-negative number.');
        const sales = Number.parseFloat(manualCampaign.sales);
        if (isNaN(sales) || sales < 0)
          throw new Error('Sales amount must be a valid non-negative number.');
        throw new Error('Invalid input. Please check values.');
      }
      const adSpend = Number.parseFloat(manualCampaign.adSpend);
      const sales = Number.parseFloat(manualCampaign.sales);
      const metrics = calculateLocalMetrics(adSpend, sales);
      const newCampaign: CampaignData = {
        campaign: manualCampaign.campaign.trim(),
        adSpend,
        sales,
        ...metrics,
      };
      setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
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
    setError(null);
    const exportData = campaigns.map((campaign) => ({
      campaign: campaign.campaign,
      adSpend: campaign.adSpend.toFixed(2),
      sales: campaign.sales.toFixed(2),
      acos:
        campaign.acos === Infinity
          ? 'Infinity'
          : (campaign.acos?.toFixed(2) ?? ''),
      roas:
        campaign.roas === Infinity
          ? 'Infinity'
          : (campaign.roas?.toFixed(2) ?? ''),
      impressions: campaign.impressions ?? '',
      clicks: campaign.clicks ?? '',
      ctr: campaign.ctr?.toFixed(2) ?? '',
      cpc: campaign.cpc?.toFixed(2) ?? '',
      revenuePerClickRate: campaign.revenuePerClickRate?.toFixed(2) ?? '',
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
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        `Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [campaigns]);

  const clearData = useCallback(() => {
    setCampaigns([]);
    setError(null);
    setManualCampaign({ campaign: '', adSpend: '', sales: '' });
  }, []);

  // --- Chart Content Logic (Fix for sonarjs/no-nested-conditional) ---
  let chartContent;
  if (isLoading) {
    chartContent = (
      <div className="flex justify-center items-center h-80">
        <Progress value={undefined} className="w-1/2" /> {/* Indeterminate */}
        <p className="ml-4 text-muted-foreground">Loading chart...</p>
      </div>
    );
  } else if (campaigns.length > 0) {
    chartContent = (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={campaigns}
          margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="campaign"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ fontSize: '12px', padding: '5px 10px' }}
            // --- FIX for TypeScript Error 2322 ---
            // Use 'any' or import ValueType from 'recharts/types/component/DefaultTooltipContent'
            // formatter={(value: ValueType) => {
            formatter={(value: any) => {
              // Handle array case (less likely for simple BarChart but good practice)
              if (Array.isArray(value)) {
                const firstValue = value[0];
                if (firstValue === Infinity) return 'Infinity';
                if (typeof firstValue === 'number')
                  return firstValue.toFixed(2);
                return firstValue ?? 'N/A';
              }
              // Handle single value case
              if (value === Infinity) return 'Infinity';
              if (typeof value === 'number') return value.toFixed(2);
              return value ?? 'N/A';
            }}
            labelFormatter={(label: string) => `Campaign: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar
            dataKey={selectedMetric}
            name={chartConfig[selectedMetric].label}
            fill={chartConfig[selectedMetric].theme.light}
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  } else {
    chartContent = (
      <div className="flex justify-center items-center h-80">
        <p className="text-muted-foreground">No data to display.</p>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">How it Works:</p>
          <ul className="list-disc list-inside ml-4">
            <li>
              Upload a CSV with columns: <code>campaign</code>,{' '}
              <code>adSpend</code>, <code>sales</code>. Optional:{' '}
              <code>impressions</code>, <code>clicks</code>.
            </li>
            <li>Or, manually enter data for a single campaign.</li>
            <li>
              The tool calculates ACoS (Advertising Cost of Sales), ROAS (Return
              on Ad Spend), and other PPC metrics if data is available.
            </li>
            <li>Visualize the distribution of a selected metric.</li>
            <li>Export the results to a new CSV file.</li>
          </ul>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Campaign Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5 ${isDragActive ? 'border-primary bg-primary/10' : ''}`}
            >
              <input {...getInputProps()} disabled={isLoading} />
              <Upload className="mb-2 h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium">
                {isDragActive
                  ? 'Drop the CSV file here...'
                  : 'Click or drag CSV file here'}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                (Requires: campaign, adSpend, sales)
              </span>
            </div>
            <SampleCsvButton
              dataType="acos"
              fileName="sample-acos-data.csv"
              className="mt-4 w-full"
              onClick={() =>
                console.log('SampleCsvButton clicked in acos-calculator.tsx')
              }
            />
          </CardContent>
        </Card>

        {/* Manual Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Manual Calculation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manual-campaign">Campaign Name*</Label>
              <Input
                id="manual-campaign"
                name="campaign"
                value={manualCampaign.campaign}
                onChange={handleManualInputChange}
                placeholder="e.g., SP - Auto - Product A"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="manual-adSpend">Ad Spend ($)*</Label>
              <Input
                id="manual-adSpend"
                name="adSpend"
                type="text"
                inputMode="decimal"
                value={manualCampaign.adSpend}
                onChange={handleManualInputChange}
                placeholder="e.g., 150.75"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="manual-sales">Sales ($)*</Label>
              <Input
                id="manual-sales"
                name="sales"
                type="text"
                inputMode="decimal"
                value={manualCampaign.sales}
                onChange={handleManualInputChange}
                placeholder="e.g., 600.50"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleManualCalculate}
              disabled={!isManualInputValid || isLoading}
              className="w-full"
            >
              {isLoading ? 'Calculating...' : 'Calculate & Add'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant={error.includes('warnings') ? 'default' : 'destructive'}>
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
      <div className="flex justify-end gap-2">
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
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2">
        <span className="text-sm font-medium mr-2">View Metric:</span>
        {Object.entries(chartConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedMetric === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedMetric(key as keyof typeof chartConfig)}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Charts Row */}
      {(campaigns.length > 0 || isLoading) && (
        <div className="grid grid-cols-1 gap-6">
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {chartConfig[selectedMetric].label} Distribution
              </CardTitle>
            </CardHeader>
            {/* --- Use the chartContent variable here --- */}
            <CardContent>{chartContent}</CardContent>
          </Card>
        </div>
      )}

      {/* ACoS Rating Guide */}
      <Card>
        <CardHeader>
          <CardTitle>ACoS Rating Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {acosRatingGuide.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${item.color.replace('text-', 'bg-')}`}
                ></span>
                <span className="font-medium">{item.label}:</span>
                <span className={`font-semibold ${item.color}`}>
                  {item.range}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Note: Ideal ACoS varies by product, category, and campaign goals.
            Lower ACoS generally indicates higher profitability from ads.
            Infinity ACoS means no sales were generated from ad spend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
