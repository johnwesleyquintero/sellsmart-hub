// src/components/amazon-seller-tools/unified-dashboard.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Papa from 'papaparse';
import React, { useCallback, useRef, useState } from 'react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { UnifiedDashboardHeader } from './UnifiedDashboardHeader';

// Tool Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFuzzyRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle, Loader2, SlidersHorizontal, Table } from 'lucide-react';
import CsvDataMapper from './CsvDataMapper';
import { ManualFbaForm } from './ManualFbaForm';
import { CompetitorAnalyzer } from './competitor-analyzer';
import { DescriptionEditor } from './description-editor';
import { InventoryManagement } from './inventory-management';
import { KeywordDeduplicator } from './keyword-deduplicator';
import { KeywordTrendAnalyzer } from './keyword-trend-analyzer';
import { ListingQualityChecker } from './listing-quality-checker';
import { OptimalPriceCalculator } from './optimal-price-calculator';
import { PpcAnalyzer } from './ppc-analyzer';

const columns: ColumnDef<any>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'firstName',
    header: 'First Name',
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'city',
    header: 'City',
  },
  {
    accessorKey: 'country',
    header: 'Country',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFuzzyRowModel: getFuzzyRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    debug: false,
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn('email')?.getFilterValue() ?? '') as string}
          onChange={(event) =>
            table.getColumn('email')?.setFilterValue(event.target.value)
          }
          className="max-w-sm shrink"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <SlidersHorizontal className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : '',
                            onClick: header.column.getCanSort()
                              ? () => {
                                  table.setSorting([
                                    {
                                      id: header.column.id,
                                      desc:
                                        header.column.getIsSorted() === 'asc',
                                    },
                                  ]);
                                }
                              : undefined,
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: <span className="ml-2">▲</span>,
                            desc: <span className="ml-2">▼</span>,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of{' '}
          {table.getCoreRowModel().rows.length} row(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Functions for Data Processing ---

// Define getDateFromRow ONCE
const getDateFromRow = (
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

// Define getNumericValueFromRow ONCE
const getNumericValueFromRow = (
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
  }
  return 0; // Default to 0 if not found or invalid
};

// Define transformCsvRow ONCE
const transformCsvRow = (
  row: Record<string, string>,
  mapping: Record<keyof DashboardMetrics, string | null>,
): DashboardMetrics | null => {
  const date = getDateFromRow(row, mapping.date);
  if (date === 'Unknown') {
    return null; // Skip rows where date cannot be determined
  }

  const sales = getNumericValueFromRow(row, mapping.sales, [
    'Ordered product sales',
    'Gross Sales',
  ]);
  const impressions = getNumericValueFromRow(row, mapping.impressions, [
    'Impressions',
  ]);
  const clicks = getNumericValueFromRow(row, mapping.clicks, ['Clicks']);
  const orders = getNumericValueFromRow(row, mapping.orders, [
    'Total order items',
    'Units Ordered',
  ]);
  const sessions = getNumericValueFromRow(row, mapping.sessions, [
    'Sessions',
    'Page Views',
  ]);

  const conversionRate = sessions > 0 ? (orders / sessions) * 100 : 0;
  const conversion_rate = parseFloat(conversionRate.toFixed(2));

  return {
    date: date,
    sales: sales,
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

// --- Component ---
import { useCacheStore } from '@/stores/cache-store';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For general loading/refresh
  const [isParsing, setIsParsing] = useState(false); // Specific state for file parsing/processing
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invalidateCache = useCacheStore((state) => state.invalidateCache);

  // --- NEW State for Mapping ---
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

  // --- MODIFIED handleFileChange ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsing(true);
    setError(null);
    setMetrics([]);
    setShowMapper(false);
    setCsvHeaders([]);
    setSelectedFile(null);

    // Pre-parse to get headers
    Papa.parse(file, {
      header: true,
      preview: 1, // Only parse the first row after the header
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        const headers = results.meta.fields || [];
        if (!headers || headers.length === 0) {
          setError('Could not read headers from the CSV file. Is it valid?');
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        console.log('Detected CSV Headers:', headers);
        setCsvHeaders(headers);
        setSelectedFile(file); // Store the file for later full parsing
        setShowMapper(true); // Show the mapper UI
        setIsParsing(false); // Stop parsing indicator for mapping phase
      },
      error: (error: Error) => {
        console.error('Error pre-parsing CSV:', error);
        setError(`Failed to read file headers: ${error.message}`);
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });

    // Don't reset file input value here, reset after full processing or cancel
  };

  // --- MODIFIED handleMappingComplete ---
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

  // --- NEW handleMappingCancel ---
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
          headers={csvHeaders}
          targetMetrics={TARGET_METRICS_CONFIG}
          onMappingComplete={handleMappingComplete}
          onMappingCancel={handleMappingCancel}
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
              <div className={`text-3xl font-bold text-gray-600`}>
                {typeof 5.21 === 'number'
                  ? (5.21).toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : 5.21}
                %
              </div>
              <div className="text-sm text-gray-500 mt-1">Conversion rate</div>
            </CardContent>
          </Card>
          <Card className="opacity-75">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
                Total Sales
              </h3>
              <div className={`text-3xl font-bold text-gray-600`}>
                {typeof 12345.67 === 'number'
                  ? (12345.67).toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : 12345.67}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total sales</div>
            </CardContent>
          </Card>
          <Card className="opacity-75">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
                Avg. Clicks
              </h3>
              <div className={`text-3xl font-bold text-gray-600`}>
                {typeof 152.3 === 'number'
                  ? (152.3).toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  : 152.3}
              </div>
              <div className="text-sm text-gray-500 mt-1">Average clicks</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
              Sales Performance{' '}
              <span className="text-sm font-normal">(Sample Data)</span>
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
            <h3 className="text-lg font-semibold mb-4 text-muted-foreground">
              Key Metrics{' '}
              <span className="text-sm font-normal">(Sample Data)</span>
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
                <TabsContent value="analyzer">
                  <KeywordTrendAnalyzer />
                </TabsContent>
                <TabsContent value="deduplicator">
                  <KeywordDeduplicator />
                </TabsContent>
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
                  <TabsTrigger value="quality">Quality Checker</TabsTrigger>
                </TabsList>
                <TabsContent value="editor">
                  <DescriptionEditor />
                </TabsContent>
                <TabsContent value="quality">
                  <ListingQualityChecker />
                </TabsContent>
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
                  <TabsTrigger value="optimal-price">Optimal Price</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="fba">
                  <ManualFbaForm />
                </TabsContent>
                <TabsContent value="optimal-price">
                  <OptimalPriceCalculator />
                </TabsContent>
                <TabsContent value="inventory">
                  <InventoryManagement />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ppc-ads">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="auditor" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="auditor">PPC Analyzer</TabsTrigger>
                </TabsList>
                <TabsContent value="auditor">
                  <PpcAnalyzer />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competition">
          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="analyzer" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="analyzer">
                    Competitor Analyzer
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="analyzer">
                  <CompetitorAnalyzer />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Ready to Supercharge Your Amazon Business?
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Explore our suite of tools designed to optimize your listings,
            analyze your competition, and maximize your profits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
