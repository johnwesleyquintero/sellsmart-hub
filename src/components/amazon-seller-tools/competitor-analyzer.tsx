import { useIsMobile } from '@/app/hooks/use-mobile';
import { Card } from '@/components/ui';
import { Info } from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { toast } from '../ui/use-toast';

interface ProcessedRow {
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
  niche?: string;
}

type MetricType = keyof Omit<ProcessedRow, 'asin' | 'niche'>;

interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface CsvRow {
  asin: string;
  price: string;
  reviews: string;
  rating: string;
  conversion_rate: string;
  click_through_rate: string;
  niche?: string;
}

export default function CompetitorAnalyzer() {
  const [asin, setAsin] = useState('');
  const [metrics, setMetrics] = useState<MetricType[]>([
    'price',
    'reviews',
    'rating',
  ]);
  const [chartData, setChartData] = useState<ChartDataPoint[] | null>(null);
  const [sellerData, setSellerData] = useState<ProcessedRow | null>(null);
  const [competitorData, setCompetitorData] = useState<ProcessedRow[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>([]);

  const processCsvData = (
    csvData: CsvRow[],
  ): { validData: ProcessedRow[]; errors: string[] } => {
    const errors: string[] = [];
    const validData = csvData
      .filter((row, index) => {
        const rowErrors: string[] = [];

        if (!row.asin || row.asin.length !== 10) {
          rowErrors.push(`Row ${index + 1}: Invalid ASIN format`);
        }
        if (isNaN(parseFloat(row.price)))
          rowErrors.push(`Row ${index + 1}: Invalid price`);
        if (isNaN(parseInt(row.reviews)))
          rowErrors.push(`Row ${index + 1}: Invalid reviews`);
        if (isNaN(parseFloat(row.rating)))
          rowErrors.push(`Row ${index + 1}: Invalid rating`);
        if (isNaN(parseFloat(row.conversion_rate)))
          rowErrors.push(`Row ${index + 1}: Invalid conversion rate`);
        if (isNaN(parseFloat(row.click_through_rate)))
          rowErrors.push(`Row ${index + 1}: Invalid CTR`);

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          return false;
        }
        return true;
      })
      .map((row) => ({
        asin: row.asin,
        price: parseFloat(row.price),
        reviews: parseInt(row.reviews),
        rating: parseFloat(row.rating),
        conversion_rate: parseFloat(row.conversion_rate),
        click_through_rate: parseFloat(row.click_through_rate),
        niche: row.niche,
      }));

    return { validData, errors };
  };

  useEffect(() => {
    if (chartData) {
      setSelectedMetrics(metrics);
    }
  }, [chartData, metrics]);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      setData: (data: ProcessedRow | ProcessedRow[]) => void,
      type: 'seller' | 'competitor',
    ) => {
      const file = event.target.files?.[0];
      setUploadErrors((prev) => ({ ...prev, [type]: [] }));
      setIsUploading(true);

      if (!file) {
        toast({
          title: 'Error',
          description: 'No file selected',
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      if (!file.name.endsWith('.csv')) {
        toast({
          title: 'Error',
          description: 'Only CSV files are supported',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result;
          if (typeof content !== 'string') {
            throw new Error('Invalid file content - file must be text-based');
          }

          Papa.parse<CsvRow>(content, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.errors.length > 0) {
                throw new Error(
                  `CSV parsing errors: ${results.errors.map((e) => e.message).join(', ')}`,
                );
              }

              const requiredHeaders = [
                'asin',
                'price',
                'reviews',
                'rating',
                'conversion_rate',
                'click_through_rate',
              ];
              const missingHeaders = requiredHeaders.filter((h) =>
                results.meta.fields ? !results.meta.fields.includes(h) : true,
              );
              if (missingHeaders.length > 0) {
                throw new Error(
                  `Missing required columns: ${missingHeaders.join(', ')}`,
                );
              }

              const { validData, errors } = processCsvData(results.data);
              setUploadErrors((prev) => ({ ...prev, [type]: errors }));

              if (errors.length > 0) {
                toast({
                  title: 'Validation Issues',
                  description: `Found ${errors.length} issues in ${file.name}`,
                  variant: 'destructive',
                });
              }

              if (validData.length > 0) {
                if (type === 'seller') {
                  setData(validData[0]);
                } else {
                  setData(validData);
                }
              }
              toast({
                title: 'Success',
                description: `${type} data (${file.name}) processed successfully`,
                variant: 'default',
              });
            },
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: `Failed to process ${type} CSV (${file.name}): ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(file);
    },
    [],
  );

  const [isLoading, setIsLoading] = useState(false);

  const analyzeCompetitor = async () => {
    if (!sellerData && !competitorData && !asin) {
      toast({
        title: 'Error',
        description: 'Please upload data files or enter an ASIN',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Process CSV data if uploaded
      let processedSellerData = sellerData;
      let processedCompetitorData = competitorData;

      // Process seller data if needed
      if (!processedSellerData && sellerData) {
        processedSellerData = sellerData;
      }

      // Process competitor data if needed
      if (!processedCompetitorData.length && competitorData.length) {
        processedCompetitorData = competitorData;
      }

      // If no API call needed (using uploaded CSV data)
      if (processedSellerData && processedCompetitorData) {
        const formattedData = processedCompetitorData.map(
          (row: ProcessedRow) => {
            const competitor = row.asin || row.niche || 'N/A';
            const dataPoint: ChartDataPoint = {
              name: competitor,
            };

            metrics.forEach((metric) => {
              const value = row[metric as keyof ProcessedRow];
              if (value !== undefined) {
                dataPoint[metric] = value;
              }
            });

            return dataPoint;
          },
        );

        if (formattedData.length > 0) {
          setChartData(formattedData);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to API call if no valid CSV data
      const response = await fetch('/api/amazon/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asin,
          metrics,
          sellerData: processedSellerData,
          competitorData: processedCompetitorData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch competitor data');
      }

      interface ApiResponse {
        competitors: string[];
        metrics: Record<MetricType, number[]>;
      }

      const data = (await response.json()) as ApiResponse;

      // Ensure data has the expected structure
      if (!data || !data.competitors || !data.metrics) {
        throw new Error('Invalid response format from server');
      }

      const formattedData = data.competitors.map((competitor, index) => {
        const dataPoint: ChartDataPoint = {
          name: competitor,
        };

        // Safely map each metric
        metrics.forEach((metric) => {
          const metricData = data.metrics[metric];
          if (Array.isArray(metricData) && metricData[index] !== undefined) {
            dataPoint[metric] = Number(metricData[index]) || 0;
          } else {
            dataPoint[metric] = 0; // Default value if data is missing
          }
        });

        return dataPoint;
      });

      // Ensure we have data to render
      if (formattedData.length > 0) {
        setChartData(formattedData);
      } else {
        throw new Error('No data available to render');
      }

      setIsLoading(false);
    } catch (error) {
      console.error(
        'Error processing file:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setChartData(null);
      setIsLoading(false);
    }
  };

  const isMobile = useIsMobile();

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div
          className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
        >
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="seller-csv">Seller Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Upload a CSV with columns: asin, price, reviews, rating,
                      conversion_rate, click_through_rate
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="seller-csv"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFileUpload(e, setSellerData, 'seller')
              }
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="competitor-csv">Competitor Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Upload a CSV with columns: asin, price, reviews, rating,
                      conversion_rate, click_through_rate
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="competitor-csv"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleFileUpload(e, setCompetitorData, 'competitor')
              }
            />
          </div>
        </div>

        <div>
          <div className="space-y-2">
            <Label htmlFor="asin">Or Enter Competitor ASIN</Label>
            <Input
              id="asin"
              value={asin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAsin(e.target.value)
              }
              placeholder="B0XXXXXXXX"
            />
            <p className="text-sm text-muted-foreground">
              ASIN format: 10 characters (letters/numbers)
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="metrics">Metrics to Compare</Label>
          <div className="flex flex-col gap-2">
            {[
              'price',
              'reviews',
              'rating',
              'sales_velocity',
              'inventory_levels',
              'conversion_rate',
              'click_through_rate',
            ].map((metric) => (
              <div key={metric} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={metric}
                  checked={metrics.includes(metric)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setMetrics([...metrics, metric]);
                    } else {
                      setMetrics(metrics.filter((m) => m !== metric));
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={metric}>
                  {metric
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={analyzeCompetitor} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Competitor'}
          </Button>
          <Button
            variant="outline"
            disabled={!chartData}
            onClick={() => {
              // Save analysis results to localStorage
              const timestamp = new Date().toISOString();
              const savedAnalyses = JSON.parse(
                localStorage.getItem('competitorAnalyses') || '[]',
              );
              savedAnalyses.push({
                id: timestamp,
                date: new Date().toLocaleString(),
                asin,
                metrics,
                chartData,
              });
              localStorage.setItem(
                'competitorAnalyses',
                JSON.stringify(savedAnalyses),
              );
              toast({
                title: 'Success',
                description: 'Analysis saved for future reference',
                variant: 'default',
              });
            }}
          >
            Save Analysis
          </Button>
        </div>

        {chartData ? (
          <div className="mt-4 h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={isMobile ? 45 : 0}
                  textAnchor={isMobile ? 'start' : 'middle'}
                  tick={{ fontSize: isMobile ? 10 : 14 }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                  }}
                  formatter={(value, name) => [
                    value,
                    name.toString().replace('_', ' ').toUpperCase(),
                  ]}
                />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
                {selectedMetrics.map((metric) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={getChartColor(metric)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
