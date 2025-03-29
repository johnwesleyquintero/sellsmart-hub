import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from '../ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Info } from 'lucide-react';
import { useIsMobile } from '../../hooks/use-mobile';
import Papa from 'papaparse';

export default function CompetitorAnalyzer() {
  const [asin, setAsin] = useState('');
  const [metrics, setMetrics] = useState<string[]>(['price', 'reviews', 'rating']);
  const [chartData, setChartData] = useState(null);
  const [sellerData, setSellerData] = useState(null);
  const [competitorData, setCompetitorData] = useState(null);

  const handleFileUpload = useCallback((event, setData, type) => {
    const file = event.target.files?.[0];
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
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Invalid file content - file must be text-based');
        }

        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
            }

            const requiredHeaders = ['asin', 'price', 'reviews', 'rating', 'conversion_rate', 'click_through_rate'];
            const missingHeaders = requiredHeaders.filter(h => !results.meta.fields.includes(h));
            if (missingHeaders.length > 0) {
              throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
            }

            setData(results.data);
            toast({
              title: 'Success',
              description: `${type} data (${file.name}) processed successfully`,
              variant: 'default',
            });
          }
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to process ${type} CSV (${file.name}): ${error.message}`,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, []);

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
      
      if (typeof sellerData === 'string') {
        processedSellerData = processCsvData(sellerData, 'seller');
      }
      
      if (typeof competitorData === 'string') {
        processedCompetitorData = processCsvData(competitorData, 'competitor');
      }
      
      // If no API call needed (using uploaded CSV data)
      if (processedSellerData && processedCompetitorData) {
        const formattedData = processedCompetitorData.map((row) => {
          const competitor = row.asin;
          const dataPoint = {
            name: competitor
          };
          
          metrics.forEach(metric => {
            if (row[metric] !== undefined) {
              dataPoint[metric] = Number(row[metric]) || 0;
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
      const response = await fetch('/api/amazon/competitor-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asin,
          metrics,
          sellerData: processedSellerData,
          competitorData: processedCompetitorData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch competitor data');
      }
      
      const data = await response.json();
      
      // Ensure data has the expected structure
      if (!data || !data.competitors || !data.metrics) {
        throw new Error('Invalid response format from server');
      }
      
      const formattedData = data.competitors.map((competitor, index) => {
        const dataPoint = {
          name: competitor
        };
        
        // Safely map each metric
        metrics.forEach(metric => {
          const metricData = data.metrics[metric];
          if (Array.isArray(metricData) && metricData[index] !== undefined) {
            dataPoint[metric] = Number(metricData[index]);
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
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="seller-csv">Seller Data CSV</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload a CSV with columns: asin, price, reviews, rating, conversion_rate, click_through_rate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="seller-csv"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, setSellerData, 'seller')}
              className="cursor-pointer"
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
                    <p>Upload a CSV with columns: asin, price, reviews, rating, conversion_rate, click_through_rate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="competitor-csv"
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, setCompetitorData, 'competitor')}
              className="cursor-pointer"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="asin">Or Enter Competitor ASIN</Label>
          <Input
            id="asin"
            value={asin}
            onChange={(e) => setAsin(e.target.value)}
            placeholder="Enter competitor ASIN"
          />
        </div>
        
        <div>
          <Label htmlFor="metrics">Metrics to Compare</Label>
          <div className="flex flex-col gap-2">
            {['price', 'reviews', 'rating', 'sales_velocity', 'inventory_levels', 'conversion_rate', 'click_through_rate'].map((metric) => (
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
                <Label htmlFor={metric}>{metric.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Label>
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
              const savedAnalyses = JSON.parse(localStorage.getItem('competitorAnalyses') || '[]');
              savedAnalyses.push({
                id: timestamp,
                date: new Date().toLocaleString(),
                asin,
                metrics,
                chartData
              });
              localStorage.setItem('competitorAnalyses', JSON.stringify(savedAnalyses));
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
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded p-2 shadow-lg">
                          <p className="font-medium">{label}</p>
                          {payload.map((entry, index) => {
                            let value = entry.value;
                            const name = entry.name;
                            if (name === 'price') {
                              value = `$${Number(value).toFixed(2)}`;
                            } else if (name.includes('rate')) {
                              value = `${(Number(value) * 100).toFixed(1)}%`;
                            } else if (name === 'rating') {
                              value = `${Number(value).toFixed(1)} stars`;
                            }
                            return (
                              <p key={index} style={{ color: entry.color }}>
                                {name}: {value}
                              </p>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {metrics.map((metric) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={metric === 'price' ? '#FF6B6B' : metric === 'reviews' ? '#4ECDC4' : '#45B7D1'}
                    activeDot={{ r: 8 }}
                  />
                ))
                ))}              
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}


  const processCsvData = (csvData, type) => {
    return csvData.map(row => {
      return {
        asin: row.asin,
        price: parseFloat(row.price),
        reviews: parseInt(row.reviews),
        rating: parseFloat(row.rating),
        conversion_rate: parseFloat(row.conversion_rate),
        click_through_rate: parseFloat(row.click_through_rate)
      };
    });
  };