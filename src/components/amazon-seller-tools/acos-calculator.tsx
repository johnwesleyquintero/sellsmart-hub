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
} from '@/components/ui'; // Corrected: Use import type for type-only imports
import { type MetricKey } from '@/lib/amazon-tools/types';
import { logError } from '@/lib/error-handling';
import {
  campaignHeaders,
  validateCampaignRow,
} from '@/lib/hooks/use-campaign-validator';
import { useCsvParser } from '@/lib/hooks/use-csv-parser';
import { monetaryValueSchema, numberSchema } from '@/lib/input-validation';
import { AlertCircle, Download, Info, Upload } from 'lucide-react';
import Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

// --- Interfaces & Types ---

export interface CampaignData {
  campaign: string;
  adSpend: number;
  sales: number;
  // Corrected: Removed redundant | undefined
  impressions?: number;
  clicks?: number;
  acos?: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
  revenuePerClickRate?: number;
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

// Removed unused constant
// const RED_COLOR = 'text-red-500';

// --- Helper Functions ---

// Removed unused function getAcosColor

const calculateLocalMetrics = (
  adSpend: number,
  sales: number,
  impressions?: number,
  clicks?: number,
  onCalculate?: (acos: number) => void,
): Omit<
  CampaignData,
  'campaign' | 'adSpend' | 'sales' | 'impressions' | 'clicks'
> => {
  try {
    // Validate inputs
    const validatedAdSpend = monetaryValueSchema.parse(adSpend);
    const validatedSales = monetaryValueSchema.parse(sales);
    const validatedImpressions =
      impressions !== undefined ? numberSchema.parse(impressions) : undefined;
    const validatedClicks =
      clicks !== undefined ? numberSchema.parse(clicks) : undefined;

    // Calculate ACoS with proper edge cases
    let acos = 0;
    if (validatedAdSpend === 0 && validatedSales === 0) {
      acos = 0;
    } else if (validatedSales === 0) {
      acos = Infinity;
    } else {
      acos = Number(((validatedAdSpend / validatedSales) * 100).toFixed(2));
    }
    if (onCalculate) onCalculate(acos);

    // Handle edge cases for ROAS calculation
    const roas = (() => {
      if (validatedAdSpend === 0 && validatedSales === 0) return 0;
      if (validatedAdSpend === 0) return Infinity;
      return Number((validatedSales / validatedAdSpend).toFixed(2));
    })();

    // Safe handling of optional metrics
    const safeImpressions = validatedImpressions ?? 0;
    const safeClicks = validatedClicks ?? 0;

    // CTR calculation with proper edge case handling
    const ctr =
      safeImpressions > 0
        ? Number(((safeClicks / safeImpressions) * 100).toFixed(2))
        : 0;

    // CPC calculation with proper edge case handling
    let cpc = 0;
    if (safeClicks > 0) {
      cpc = Number((validatedAdSpend / safeClicks).toFixed(2));
    } else if (validatedAdSpend > 0) {
      cpc = Infinity;
    }

    // Revenue per click rate with proper edge case handling
    let revenuePerClickRate = 0;
    if (safeClicks > 0) {
      revenuePerClickRate = Number(
        ((validatedSales / safeClicks) * 100).toFixed(2),
      );
    } else if (validatedSales > 0) {
      revenuePerClickRate = Infinity;
    }

    return { acos, roas, ctr, cpc, revenuePerClickRate };
  } catch (error) {
    logError({
      message: 'Error calculating metrics',
      component: 'AcosCalculator',
      severity: 'medium',
      error: error as Error,
      context: { adSpend, sales, impressions, clicks },
    });
    return { acos: 0, roas: 0, ctr: 0, cpc: 0, revenuePerClickRate: 0 };
  }
};

// --- Component ---

export default function AcosCalculator() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectedMetric, setSelectedMetric] =
    useState<keyof typeof chartConfig>('acos');
  const [manualCampaign, setManualCampaign] = useState({
    campaign: '',
    adSpend: '',
    sales: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    adSpend: string;
    sales: string;
    campaign: string;
  }>({
    adSpend: 'Ad spend must be greater than 0',
    sales: 'Sales amount must be greater than 0',
    campaign: '',
  });

  // Cleanup effect for memory leak prevention
  useEffect(() => {
    return () => {
      // Cleanup function to prevent state updates after unmount
      setCampaigns([]);
      setError(undefined);
      setIsLoading(false);
    };
  }, []);

  const isManualInputValid = useMemo(() => {
    const adSpendNum = Number.parseFloat(manualCampaign.adSpend);
    const salesNum = Number.parseFloat(manualCampaign.sales);
    return (
      manualCampaign.campaign.trim() !== '' &&
      !isNaN(adSpendNum) &&
      adSpendNum > 0 &&
      !isNaN(salesNum) &&
      salesNum > 0
    );
  }, [manualCampaign]);

  const csvParser = useCsvParser<CampaignData>(
    {
      requiredHeaders: campaignHeaders.required,
      validateRow: (row) => {
        try {
          const adSpend = Number(row.adSpend);
          const sales = Number(row.sales);
          if (isNaN(adSpend) || isNaN(sales)) {
            throw new Error('Ad spend and sales must be valid numbers');
          }
          const result = validateCampaignRow({ ...row, adSpend, sales }, 0);
          return result as CampaignData;
        } catch (error) {
          throw new Error(
            `Invalid row data: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
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
          Number(row.adSpend),
          Number(row.sales),
          Number(row.impressions) || undefined,
          Number(row.clicks) || undefined,
        );
        return { ...row, ...metrics };
      });
      setCampaigns(dataWithMetrics);
      setIsLoading(false);
      if (result.skippedRows.length > 0) {
        setError(
          `Processed with warnings: ${result.skippedRows.length} rows were skipped. First error: ${result.skippedRows[0].reason}`,
        );
      } else {
        setError(undefined);
      }
    },
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) {
        setError('No file selected');
        return;
      }
      setIsLoading(true);
      setError(undefined);
      // Corrected: Call async function without making the callback async itself
      csvParser.parseFile(file).catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
    },
    [csvParser], // csvParser dependency is correct
  );

  const { getRootProps, getInputProps } = useDropzone({
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
      setError(undefined);
    },
    [],
  );

  const handleManualCalculate = useCallback(() => {
    console.log('handleManualCalculate called');
    setError(undefined);
    setValidationErrors({ adSpend: '', sales: '', campaign: '' });
    setIsLoading(true);
    try {
      // Validate all fields and collect errors
      const newValidationErrors = {
        campaign: '',
        adSpend: '',
        sales: '',
      };

      if (!manualCampaign.campaign.trim()) {
        newValidationErrors.campaign = 'Please enter a campaign name.';
      }

      const adSpend = Number.parseFloat(manualCampaign.adSpend);
      if (isNaN(adSpend) || adSpend <= 0) {
        newValidationErrors.adSpend = 'Ad Spend must be greater than 0.';
      }

      const sales = Number.parseFloat(manualCampaign.sales);
      if (isNaN(sales) || sales <= 0) {
        newValidationErrors.sales = 'Sales amount must be greater than 0.';
      }

      // Check if there are any validation errors
      const hasErrors = Object.values(newValidationErrors).some(
        (error) => error !== '',
      );
      if (hasErrors) {
        setValidationErrors(newValidationErrors);
        throw new Error('Please fix the validation errors.');
      }
      // const adSpend1 = Number.parseFloat(manualCampaign.adSpend);
      // const sales1 = Number.parseFloat(manualCampaign.sales);
      // console.log('Manual input: adSpend =', adSpend1, 'sales =', sales1);
      const metrics = calculateLocalMetrics(adSpend, sales);

      console.log('Calculated metrics:', metrics);
      const newCampaign: CampaignData = {
        campaign: manualCampaign.campaign.trim(),
        adSpend,
        sales,
        ...metrics,
      };
      console.log('New campaign:', newCampaign);
-------
-------
      setManualCampaign({ campaign: '', adSpend: '', sales: '' });
      console.log('ACoS calculated in handleManualCalculate:', metrics.acos);
      setCampaigns((prevCampaigns) => [...prevCampaigns, newCampaign]);
      console.log('Campaigns after manual calculation:', campaigns);
      console.log('Metrics ACOS after manual calculation:', metrics.acos);
      return metrics.acos;
    } catch (error) {
      console.error('Error calculating ACOS:', error);
      setError(
        error instanceof Error ? error.message : 'An unknown error occurred',
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [manualCampaign, isManualInputValid, campaigns]);

  const handleExport = useCallback(() => {
    if (campaigns.length === 0) {
      setError('No data to export.');
      return;
    }
    // Corrected: Use undefined instead of null
    setError(undefined);
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
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        `Failed to generate CSV: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }, [campaigns]);

  const clearData = useCallback(() => {
    setCampaigns([]);
    // Corrected: Use undefined instead of null
    setError(undefined);
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
          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ fontSize: '12px', padding: '5px 10px' }}
            // Corrected: Use 'unknown' and type checks instead of 'any'
            formatter={(value: unknown) => {
              // Handle array case (less likely for simple BarChart but good practice)
              if (Array.isArray(value)) {
                const firstValue = value[0];
                if (firstValue === Infinity) return 'Infinity'; // Corrected: Use 'Infinity' string
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
      <div
        className="flex justify-center items-center h-80"
        data-testid="acos-value"
      >
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
              Upload a CSV with columns: <code>campaign</code>,&nbsp;
              <code>adSpend</code>, <code>sales</code>. Optional:&nbsp;
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
        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Campaign Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center transition-colors hover:bg-primary/5 "
            >
              <input {...getInputProps()} data-testid="csv-upload-input" />
              <Upload className="mb-2 h-8 w-8 text-primary/60" />
              <span className="text-sm font-medium">
                Click or drag CSV file here
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                (Requires: campaign, adSpend, sales)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card>
          <CardHeader>
            <CardTitle>Manually Enter Campaign Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaign">Campaign Name</Label>
              <Input
                type="text"
                id="campaign"
                name="campaign"
                value={manualCampaign.campaign}
                onChange={handleManualInputChange}
                placeholder="Enter campaign name"
              />
              {validationErrors.campaign ? (
                <p className="text-xs text-red-500">
                  {validationErrors.campaign}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="adSpend">Ad Spend ($)</Label>
              <Input
                type="number"
                id="adSpend"
                name="adSpend"
                value={manualCampaign.adSpend}
                onChange={handleManualInputChange}
                placeholder="Enter ad spend"
              />
              {validationErrors.adSpend ? (
                <p className="text-xs text-red-500">
                  {validationErrors.adSpend}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="sales">Sales Amount</Label>
              <Input
                type="number"
                id="sales"
                name="sales"
                value={manualCampaign.sales}
                onChange={handleManualInputChange}
                placeholder="Enter sales amount"
              />
              {validationErrors.sales ? (
                <p className="text-xs text-red-500">{validationErrors.sales}</p>
              ) : null}
            </div>
            <Button
              onClick={handleManualCalculate}
              disabled={!isManualInputValid || isLoading}
            >
              Calculate
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alert Section */}
      {error && (
        <Alert variant={error.includes('warnings') ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Display and Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Metric Selection */}
          <div className="flex justify-end gap-2">
            <p className="text-sm font-medium">Select Metric:</p>
            {Object.entries(chartConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedMetric === key ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setSelectedMetric(key as keyof typeof chartConfig)
                }
              >
                {config.label}
              </Button>
            ))}
          </div>
          {/* Chart */}
          {chartContent}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent>
          <div className="flex justify-end gap-2">
            <Button onClick={handleExport} disabled={campaigns.length === 0}>
              Export Data <Download className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={clearData}
              disabled={campaigns.length === 0}
            >
              Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
