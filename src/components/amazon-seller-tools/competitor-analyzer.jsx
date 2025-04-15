var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useIsMobile } from '@/app/hooks/use-mobile';
import { Card } from '@/components/ui';
import { Info } from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis, } from 'recharts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '../ui/tooltip';
import { toast } from '../ui/use-toast';
const getChartColor = (metric) => {
    const colors = {
        price: '#2563eb',
        reviews: '#16a34a',
        rating: '#eab308',
        conversion_rate: '#dc2626',
        click_through_rate: '#9333ea',
    };
    return colors[metric];
};
export default function CompetitorAnalyzer() {
    const [asin, setAsin] = useState('');
    const [metrics, setMetrics] = useState([
        'price',
        'reviews',
        'rating',
    ]);
    const [chartData, setChartData] = useState(null);
    const [sellerData, setSellerData] = useState(null);
    const [competitorData, setCompetitorData] = useState([]);
    const [selectedMetrics, setSelectedMetrics] = useState([]);
    const validateAndProcessData = (data) => {
        const errors = [];
        const validData = data
            .filter((row, index) => {
            const rowErrors = [];
            if (!row.asin || row.asin.length !== 10) {
                rowErrors.push(`Row ${index + 1}: Invalid ASIN format`);
            }
            if (isNaN(parseFloat(row.price))) {
                rowErrors.push(`Row ${index + 1}: Invalid price`);
            }
            if (isNaN(parseInt(row.reviews))) {
                rowErrors.push(`Row ${index + 1}: Invalid reviews`);
            }
            if (isNaN(parseFloat(row.rating))) {
                rowErrors.push(`Row ${index + 1}: Invalid rating`);
            }
            if (isNaN(parseFloat(row.conversion_rate))) {
                rowErrors.push(`Row ${index + 1}: Invalid conversion rate`);
            }
            if (isNaN(parseFloat(row.click_through_rate))) {
                rowErrors.push(`Row ${index + 1}: Invalid CTR`);
            }
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
    const handleFileUpload = useCallback((event, setData) => {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file) {
            toast({
                title: 'Error',
                description: 'No file selected',
                variant: 'destructive',
            });
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
        reader.onload = (e) => {
            var _a;
            try {
                const csvData = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                Papa.parse(csvData, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const { validData, errors } = validateAndProcessData(results.data);
                        if (errors.length > 0) {
                            toast({
                                title: 'Warning',
                                description: `Some rows had validation errors: ${errors.join(', ')}`,
                                variant: 'destructive',
                            });
                        }
                        setData(validData);
                    },
                    error: (error) => {
                        console.error('CSV parsing error:', error);
                        toast({
                            title: 'Error',
                            description: 'Failed to parse CSV file',
                            variant: 'destructive',
                        });
                    },
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('File processing error:', error);
                    toast({
                        title: 'Error',
                        description: error.message,
                        variant: 'destructive',
                    });
                }
            }
        };
        reader.readAsText(file);
    }, []);
    const [isLoading, setIsLoading] = useState(false);
    const analyzeCompetitor = () => __awaiter(this, void 0, void 0, function* () {
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
                const formattedData = processedCompetitorData.map((row) => {
                    const competitor = row.asin || row.niche || 'N/A';
                    const dataPoint = {
                        name: competitor,
                    };
                    metrics.forEach((metric) => {
                        const value = row[metric];
                        if (value !== undefined) {
                            dataPoint[metric] = value;
                        }
                    });
                    return dataPoint;
                });
                if (formattedData.length > 0) {
                    setChartData(formattedData);
                    setIsLoading(false);
                    return;
                }
            }
            // Fallback to API call if no valid CSV data
            const response = yield fetch('/api/amazon/competitor-analysis', {
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
            let data;
            try {
                data = yield response.json();
                if (!data || !data.competitors || !data.metrics) {
                    throw new Error('Invalid response format from server');
                }
            }
            catch (error) {
                throw new Error(error instanceof Error
                    ? error.message
                    : 'Failed to parse server response');
            }
            const formattedData = data.competitors.map((competitor, index) => {
                const dataPoint = {
                    name: competitor,
                };
                // Safely map each metric
                metrics.forEach((metric) => {
                    const metricData = data.metrics[metric];
                    if (Array.isArray(metricData) && metricData[index] !== undefined) {
                        dataPoint[metric] = Number(metricData[index]) || 0;
                    }
                    else {
                        dataPoint[metric] = 0; // Default value if data is missing
                    }
                });
                return dataPoint;
            });
            // Ensure we have data to render
            if (formattedData.length > 0) {
                setChartData(formattedData);
            }
            else {
                throw new Error('No data available to render');
            }
            setIsLoading(false);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Error processing file:', errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            setChartData(null);
            setIsLoading(false);
        }
    });
    const isMobile = useIsMobile();
    return (<Card className="p-6">
      <div className="space-y-4">
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="seller-csv">Seller Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground"/>
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
            <Input id="seller-csv" onChange={(e) => handleFileUpload(e, setSellerData, 'seller')}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="competitor-csv">Competitor Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground"/>
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
            <Input id="competitor-csv" onChange={(e) => handleFileUpload(e, setCompetitorData, 'competitor')}/>
          </div>
        </div>

        <div>
          <div className="space-y-2">
            <Label htmlFor="asin">Or Enter Competitor ASIN</Label>
            <Input id="asin" value={asin} onChange={(e) => setAsin(e.target.value)} placeholder="B0XXXXXXXX"/>
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
            'conversion_rate',
            'click_through_rate',
        ].map((metric) => (<div key={metric} className="flex items-center gap-2">
                <input type="checkbox" id={metric} checked={metrics.includes(metric)} onChange={(e) => {
                if (e.target.checked) {
                    setMetrics([...metrics, metric]);
                }
                else {
                    setMetrics(metrics.filter((m) => m !== metric));
                }
            }} className="h-4 w-4 rounded border-gray-300"/>
                <Label htmlFor={metric}>
                  {metric
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
                </Label>
              </div>))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={analyzeCompetitor} disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Competitor'}
          </Button>
          <Button variant="outline" disabled={!chartData} onClick={() => {
            // Save analysis results to localStorage
            const timestamp = new Date().toISOString();
            const savedAnalyses = JSON.parse(localStorage.getItem('competitorAnalyses') || '[]');
            savedAnalyses.push({
                id: timestamp,
                date: new Date().toLocaleString(),
                asin,
                metrics,
                chartData,
            });
            localStorage.setItem('competitorAnalyses', JSON.stringify(savedAnalyses));
            toast({
                title: 'Success',
                description: 'Analysis saved for future reference',
                variant: 'default',
            });
        }}>
            Save Analysis
          </Button>
        </div>

        {chartData ? (<div className="mt-4 h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
            }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name" angle={isMobile ? 45 : 0} textAnchor={isMobile ? 'start' : 'middle'} tick={{ fontSize: isMobile ? 10 : 14 }}/>
                <YAxis />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="w-full">
                      <Info className="mr-2 h-4 w-4"/>
                      View Analysis
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white border border-gray-300 rounded-md shadow-sm">
                    {chartData && chartData.length > 0 ? (chartData.map((entry, index) => (<div key={`tooltip-${index}`}>
                          {entry.name}: {entry.price}
                        </div>))) : (<div>No data available</div>)}
                  </TooltipContent>
                </Tooltip>
                <Legend wrapperStyle={{ paddingTop: 20 }}/>
                {selectedMetrics.map((metric) => (<Line key={metric} type="monotone" dataKey={metric} stroke={getChartColor(metric)} strokeWidth={2} dot={{ r: 4 }}/>))}
              </LineChart>
            </ResponsiveContainer>
          </div>) : null}
      </div>
    </Card>);
}
