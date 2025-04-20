// src/components/amazon-seller-tools/unified-dashboard.tsx
'use client';

import { Button } from '@/components/ui/button'; // Import Button
// Removed unused Input import for file, using standard HTML input instead
// import { Input } from '@/components/ui/input';
import Papa from 'papaparse'; // Import papaparse
import React, { useCallback, useRef, useState } from 'react';
// ... other imports: Card, Tabs, Charts, Header, Tool Components ...
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// --- Interface (Keep as is, but know we need to map CSV data TO this) ---
interface DashboardMetrics {
  date: string; // Expecting a date/period string from the report
  sales: number; // Expecting total sales value
  profit: number; // May need calculation or come from a specific report
  acos: number; // Likely from Advertising reports
  impressions: number; // Likely from Advertising reports
  clicks: number; // Likely from Advertising reports
  conversion_rate: number; // May need calculation (Orders / Sessions) * 100
  inventory_level: number; // From Inventory reports (might be separate upload)
  review_rating: number; // Not typically in standard reports
}

// --- Component ---
export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  // Initialize metrics state, perhaps empty or with placeholder structure
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For general loading/refresh
  const [isParsing, setIsParsing] = useState(false); // Specific state for file parsing
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden file input

  // --- Data Fetching/Processing Logic ---

  // Placeholder for refresh (might clear data or re-fetch if API existed)
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // In a file-based system, refresh might just mean clearing status
    // Or potentially re-applying last uploaded data if stored persistently
    console.log('Refresh clicked - clearing status.');
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate action
    setIsLoading(false);
  }, []);

  // Handler for file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsing(true);
    setError(null);
    setMetrics([]); // Clear previous metrics

    Papa.parse<Record<string, string>>(file, {
      header: true, // Assumes first row is header
      skipEmptyLines: true,
      complete: (results) => {
        console.log('Parsed CSV Data:', results.data); // Log raw parsed data
        try {
          // **** CRITICAL STEP: Transform results.data into DashboardMetrics[] ****
          // This depends HEAVILY on the specific report format.
          // Example: Assuming a Business Report (Sales and Traffic) CSV
          const transformedMetrics = results.data
            .map((row) => {
              // --- Data Cleaning and Transformation ---
              // Get values, provide defaults (0 or NaN), parse numbers
              const date =
                row['Date'] || row['Settlement end date'] || 'Unknown'; // Adjust based on actual header
              const sales = parseFloat(
                row['Ordered product sales']?.replace(/[^0-9.-]+/g, '') || '0',
              );
              const sessions = parseInt(row['Sessions'] || '0', 10);
              const orders = parseInt(row['Total order items'] || '0', 10);
              // Add more fields as needed from the report...
              const impressions = parseInt(row['Impressions'] || '0', 10); // Example if PPC data is merged/present
              const clicks = parseInt(row['Clicks'] || '0', 10); // Example if PPC data is merged/present

              // --- Calculations (Example) ---
              const conversion_rate =
                sessions > 0
                  ? parseFloat(((orders / sessions) * 100).toFixed(2))
                  : 0;

              // --- Return structured object (ensure all fields exist) ---
              // NOTE: Profit, ACoS, Inventory, Rating might come from *different* reports
              // or require manual input/calculation elsewhere. Initialize them reasonably.
              return {
                date: date,
                sales: isNaN(sales) ? 0 : sales,
                profit: 0, // Placeholder - needs separate data/calculation
                acos: 0, // Placeholder - needs separate data/calculation
                impressions: isNaN(impressions) ? 0 : impressions, // Placeholder
                clicks: isNaN(clicks) ? 0 : clicks, // Placeholder
                conversion_rate: isNaN(conversion_rate) ? 0 : conversion_rate,
                inventory_level: 0, // Placeholder - needs separate data
                review_rating: 0, // Placeholder - needs separate data
              };
            })
            // Optional: Filter out rows that couldn't be parsed meaningfully
            .filter((metric) => metric.date !== 'Unknown');

          console.log('Transformed Metrics:', transformedMetrics);
          setMetrics(transformedMetrics);
          if (transformedMetrics.length === 0 && results.data.length > 0) {
            setError(
              'Could not extract valid data. Check report format/headers.',
            );
          } else if (transformedMetrics.length === 0) {
            setError('No data rows found in the file.');
          }
        } catch (transformError: any) {
          console.error('Error transforming data:', transformError);
          setError(`Error processing report data: ${transformError.message}`);
          setMetrics([]); // Clear metrics on error
        } finally {
          setIsParsing(false);
        }
      },
      error: (error: Error) => {
        console.error('Error parsing CSV:', error);
        setError(`Failed to parse file: ${error.message}`);
        setMetrics([]);
        setIsParsing(false);
      },
    });

    // Reset file input value so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger hidden file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleExport = useCallback(() => {
    console.log('Exporting dashboard data...');
    // Export logic would use the current 'metrics' state
    if (metrics.length === 0) {
      setError('No data to export.');
      return;
    }
    try {
      const csv = Papa.unparse(metrics);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dashboard_metrics.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setError(null); // Clear error on success
    } catch (err) {
      setError(
        `Failed to export data: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }, [metrics]);

  // --- Render ---
  return (
    // FIX: Added closing div tag
    <div className="container mx-auto p-4 space-y-4">
      <UnifiedDashboardHeader
        // Show loading if parsing or general loading is happening
        isLoading={isLoading || isParsing}
        error={error}
        onRefresh={handleRefresh}
        onExport={handleExport}
        // Optional: Add the upload button to the header instead
        // customActions={
        //   <Button onClick={handleUploadClick} disabled={isParsing}>
        //     {isParsing ? 'Parsing...' : 'Upload Report'}
        //   </Button>
        // }
      />

      {/* FIX: Added closing Tabs tag */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ... TabsList ... */}
        <TabsList className="mb-4 flex flex-wrap h-auto justify-start">
          {/* ... TabsTriggers ... */}
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="listing-optimization">
            Listing Optimization
          </TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="ppc-ads">PPC & Ads</TabsTrigger>
          <TabsTrigger value="competition">Competition</TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* --- Upload Button Area --- */}
          <div className="mb-4 p-4 border rounded-md bg-muted/40">
            <h4 className="text-lg font-medium mb-2">Load Overview Data</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Upload your Amazon Business Report (Sales and Traffic - CSV
              format) to populate the overview charts and cards.
            </p>
            {/* FIX: Replaced custom Input with standard HTML input for file type */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv" // Accept only CSV files
              className="hidden" // Hide the default input
              id="csvFileInput"
            />
            {/* Use a label acting as a button for better accessibility */}
            <Button onClick={handleUploadClick} disabled={isParsing}>
              {isParsing ? 'Parsing Report...' : 'Choose Report File (.csv)'}
            </Button>
            {isParsing && (
              <p className="mt-2 text-sm text-blue-600">Processing file...</p>
            )}
            {/* Display error specific to upload/parsing here */}
            {error && !isLoading && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          {/* --- End Upload Button Area --- */}

          {/* Conditional Rendering based on metrics data */}
          {!isParsing && metrics && metrics.length > 0 && (
            <>
              {/* --- Overview Content (Charts, Cards using 'metrics' state) --- */}
              {/* (Your existing card and chart components go here) */}
              {/* Example Card using the last data point */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Conversion Rate
                    </h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics[metrics.length - 1]?.conversion_rate ?? 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      From Uploaded Report
                    </div>
                  </CardContent>
                </Card>
                {/* Add other cards similarly */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Total Sales</h3>
                    <div className="text-3xl font-bold text-green-600">
                      $
                      {metrics
                        .reduce((sum, m) => sum + m.sales, 0)
                        .toFixed(2) ?? 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Sum from Report Period
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Avg. Clicks</h3>
                    <div className="text-3xl font-bold text-yellow-600">
                      {(
                        metrics.reduce((sum, m) => sum + m.clicks, 0) /
                        metrics.length
                      ).toFixed(1) ?? 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Average from Report
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Example Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Sales Trends (from Report)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          stroke="#8884d8"
                          name="Sales"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                {/* Add other charts similarly */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      Clicks & Impressions (from Report)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="impressions"
                          fill="#8884d8"
                          name="Impressions"
                        />
                        <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          {/* Show message if no data has been loaded yet */}
          {!isParsing && metrics.length === 0 && !error && (
            <p className="text-center text-muted-foreground py-6">
              Upload a report to view overview data.
            </p>
          )}
        </TabsContent>

        {/* Placeholder for other TabsContent */}
        <TabsContent value="keywords">
          <Card>
            <CardContent className="p-4">
              <p>Keyword Analysis Tool Content Goes Here</p>
              {/* Integrate KeywordAnalyzer component or its logic */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="listing-optimization">
          <Card>
            <CardContent className="p-4">
              <p>Listing Optimization Tools Content Goes Here</p>
              {/* Integrate DescriptionEditor, ListingQualityChecker etc. */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financials">
          <Card>
            <CardContent className="p-4">
              <p>Financial Calculators Content Goes Here</p>
              {/* Integrate FbaCalculator, AcosCalculator, ProfitMarginCalculator etc. */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ppc-ads">
          <Card>
            <CardContent className="p-4">
              <p>PPC & Ads Tools Content Goes Here</p>
              {/* Integrate PpcCampaignAuditor etc. */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="competition">
          <Card>
            <CardContent className="p-4">
              <p>Competitor Analysis Tools Content Goes Here</p>
              {/* Integrate CompetitorAnalyzer etc. */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
