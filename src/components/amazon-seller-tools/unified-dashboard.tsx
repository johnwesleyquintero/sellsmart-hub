// src/components/amazon-seller-tools/unified-dashboard.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Papa from 'papaparse';
import { useCallback, useRef, useState } from 'react';
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
import { UnifiedDashboardHeader } from './UnifiedDashboardHeader';

// Tool Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { AlertCircle, Loader2 } from 'lucide-react';
import CsvDataMapper from './CsvDataMapper';

export interface DashboardMetrics {
  date: string;
  sales: number;
  profit: number;
  acos: number;
  impressions: number;
  clicks: number;
  conversion_rate: number;
  inventory_level: number;
  review_rating: number;
  orders: number;
  sessions: number;
}

const TARGET_METRICS_CONFIG = {
  default: {
    date: 'Date',
    sales: 'Sales',
    impressions: 'Impressions',
    clicks: 'Clicks',
    orders: 'Orders',
    sessions: 'Sessions',
  },
  detailed: {
    date: 'Date',
    sales: 'Ordered product sales',
    impressions: 'Impressions',
    clicks: 'Clicks',
    orders: 'Total order items',
    sessions: 'Sessions',
  },
  alternative: {
    date: 'Date',
    sales: 'Gross Sales',
    impressions: 'Impressions',
    clicks: 'Clicks',
    orders: 'Units Ordered',
    sessions: 'Page Views',
  },
};

const TARGET_METRICS = Object.keys(TARGET_METRICS_CONFIG.default).map(
  (key) => ({
    key: key as keyof DashboardMetrics,
    label:
      TARGET_METRICS_CONFIG.default[
        key as keyof typeof TARGET_METRICS_CONFIG.default
      ],
    required: true,
  }),
);

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For general loading/refresh
  const [isParsing, setIsParsing] = useState(false); // Specific state for file parsing/processing
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onInvalidateCache = () => {};

  const [showMapper, setShowMapper] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // --- End NEW State ---

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowMapper(false); // Ensure mapper is hidden on refresh
    setCsvHeaders([]);
    setSelectedFile(null);
    setMetrics([]); // Optionally clear metrics on refresh
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => window.setTimeout(resolve, 500)); // Simulate action
    setIsLoading(false);
  }, []);

  const handleUploadClick = () => {
    // Reset state before triggering upload to ensure clean slate
    setMetrics([]);
    setError(null);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear previous selection
    }
    fileInputRef.current?.click();
  };

  const handleExport = useCallback(() => {
    console.log('Exporting dashboard data...');
    if (metrics.length === 0) {
      setError('No data to export.');
      return;
    }
    try {
      const csv = Papa.unparse(metrics);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dashboard_metrics.csv');
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError(
        `Failed to export data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }, [metrics]);

  const handleMappingComplete = (
    mapping: Record<keyof DashboardMetrics, string | null>,
  ) => {
    console.log('Mapping confirmed:', mapping);
    if (!selectedFile) {
      setError('No file selected for processing.');
      setShowMapper(false);
      return;
    }

    setShowMapper(false);
    setIsParsing(true); // Start processing indicator
    setError(null);
    setMetrics([]);

    // Now parse the *full* file using the mapping
    Papa.parse<Record<string, string>>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        console.log('Parsed Full CSV Data:', results.data);
        try {
          // Use the extracted helper function for transformation
          const transformedMetrics = results.data
            .map((row: Record<string, string>) => transformCsvRow(row, mapping))
            .filter(
              (metric: DashboardMetrics | null): metric is DashboardMetrics =>
                metric !== null,
            ); // Filter out nulls (rows that couldn't be processed)

          console.log('Transformed Metrics:', transformedMetrics);

          if (transformedMetrics.length === 0 && results.data.length > 0) {
            setError(
              'Could not extract valid data using the provided mapping. Check mapping and report format/headers.',
            );
            setMetrics([]);
          } else if (transformedMetrics.length === 0) {
            setError(
              'No data rows found or processed successfully in the file.',
            );
            setMetrics([]);
          } else {
            setMetrics(transformedMetrics.map((metric) => ({ ...metric })));
            setError(null); // Clear error on success
          }
        } catch (transformError: unknown) {
          console.error('Error transforming data:', transformError);
          setError(
            `Error processing report data: ${transformError instanceof Error ? transformError.message : 'Unknown error'}`,
          );
          setMetrics([]);
        } finally {
          setIsParsing(false);
          // Reset file input after successful processing
          if (fileInputRef.current) fileInputRef.current.value = '';
          setSelectedFile(null); // Clear stored file
        }
      },
      error: (error: Error) => {
        console.error('Error parsing full CSV:', error);
        setError(`Failed to parse file: ${error.message}`);
        setMetrics([]);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null); // Clear stored file
      },
    });
  };

  const handleMappingCancel = () => {
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);
    setError(null); // Clear any errors from pre-parsing
    setIsParsing(false);
    // Reset file input if user cancels mapping
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    console.log('Mapping cancelled.');
  };

  // Define transformCsvRow ONCE
  const transformCsvRow = (
    row: Record<string, string>,
    mapping: Record<keyof DashboardMetrics, string | null>,
  ): DashboardMetrics | null => {
    const date = (
      row: Record<string, string>,
      mappedHeader: string | null,
    ): string => {
      const potentialHeaders = [
        mappedHeader,
        'Date',
        'Settlement end date',
        'Day',
        'Week',
        'Month',
      ].filter(Boolean) as string[];
      for (const header of potentialHeaders) {
        if (row[header]) return row[header];
      }
      return 'Unknown';
    };

    const sales = (
      row: Record<string, string>,
      mappedHeader: string | null,
      fallbackHeaders: string[] = [],
    ): number => {
      const headersToCheck = [mappedHeader, ...fallbackHeaders].filter(
        Boolean,
      ) as string[];
      for (const header of headersToCheck) {
        const rawValue = row[header];
        if (rawValue !== undefined && rawValue !== null) {
          const cleanedValue = String(rawValue).replace(/[^0-9.-]+/g, '');
          const num = parseFloat(cleanedValue);
          if (!isNaN(num)) return num;
        }
        return 0; // Default to 0 if not found or invalid
      }
      return 0;
    };

    const dateValue = date(row, mapping.date);
    if (dateValue === 'Unknown') {
      return null; // Skip rows where date cannot be determined
    }

    const salesValue = sales(row, mapping.sales, [
      'Ordered product sales',
      'Gross Sales',
    ]);
    const impressions = sales(row, mapping.impressions, ['Impressions']);
    const clicks = sales(row, mapping.clicks, ['Clicks']);
    const orders = sales(row, mapping.orders, [
      'Total order items',
      'Units Ordered',
    ]);
    const sessions = sales(row, mapping.sessions, ['Sessions', 'Page Views']);

    const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;
    const conversion_rate = parseFloat(conversionRate.toFixed(2));

    return {
      date: dateValue,
      sales: salesValue,
      profit: 0, // Placeholder
      acos: 0, // Placeholder
      impressions: impressions,
      clicks: clicks,
      conversion_rate: isNaN(conversion_rate) ? 0 : conversion_rate,
      inventory_level: 0, // Placeholder
      review_rating: 0, // Placeholder
      orders: orders,
      sessions: sessions,
    };
  };

  // --- Refactored Rendering Logic for Overview Tab ---
  const renderOverviewContent = () => {
    if (isParsing) {
      return (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="mt-4 text-gray-500">Processing report data...</p>
          </CardContent>
        </Card>
      );
    }

    if (showMapper) {
      return (
        <CsvDataMapper
          csvHeaders={csvHeaders}
          targetMetrics={TARGET_METRICS}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
        />
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card className="opacity-75">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
                Conversion Rate
              </h3>
            </CardContent>
          </Card>
          <Card className="opacity-75">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
                Total Sales
              </h3>
            </CardContent>
          </Card>
          <Card className="opacity-75">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
                Sessions
              </h3>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
              Metrics Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
              Sales by Date
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <UnifiedDashboardHeader
        onRefresh={handleRefresh}
        onUploadClick={handleUploadClick}
        onExport={handleExport}
        isLoading={isLoading}
        error={error}
        onInvalidateCache={onInvalidateCache}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Analysis</TabsTrigger>
          <TabsTrigger value="listing-optimization">
            Listing Optimization
          </TabsTrigger>
          <TabsTrigger value="financials">Financial Analysis</TabsTrigger>
          <TabsTrigger value="ppc-ads">PPC Ads Analysis</TabsTrigger>
          <TabsTrigger value="competition">Competitor Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{renderOverviewContent()}</TabsContent>

        <TabsContent value="keywords">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
                  <TabsTrigger value="deduplicator">Deduplicator</TabsTrigger>
                </TabsList>
                {/* <TabsContent value="analyzer">
                  <KeywordAnalyzer />
                </TabsContent>
                <TabsContent value="deduplicator">
                  <KeywordDeduplicator />
                </TabsContent> */}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listing-optimization">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="lqc">LQC</TabsTrigger>
                </TabsList>
                {/* <TabsContent value="editor">
                  <DescriptionEditor />
                </TabsContent>
                <TabsContent value="lqc">
                  <ListingQualityChecker />
                </TabsContent> */}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financials">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="fba" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="fba">FBA Calculator</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="optimal-price">Optimal Price</TabsTrigger>
                </TabsList>
                {/* <TabsContent value="fba">
                  <ManualFbaForm />
                </TabsContent>
                <TabsContent value="inventory">
                  <InventoryManagement />
                </TabsContent>
                <TabsContent value="optimal-price">
                  <OptimalPriceCalculator />
                </TabsContent> */}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ppc-ads">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="auditor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="auditor">Auditor</TabsTrigger>
                  <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
                </TabsList>
                {/* <TabsContent value="auditor">
                  <PpcAuditor />
                </TabsContent>
                <TabsContent value="analyzer">
                  <PpcAnalyzer />
                </TabsContent> */}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competition">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
                  <TabsTrigger value="competitor">Competitor</TabsTrigger>
                </TabsList>
                {/* <TabsContent value="analyzer">
                  <CompetitorAnalyzer />
                </TabsContent>
                <TabsContent value="competitor">
                  <CompetitorAnalysis />
                </TabsContent> */}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <CardContent className="p-6 text-center">
          {/* <Roadmap /> */}
        </CardContent>
      </Card>
    </div>
  );
}
