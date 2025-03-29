import { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { toast } from '../ui/use-toast';
import { Info } from 'lucide-react';
import { TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

export default function KeywordTrendAnalyzer() {
  const [keywords, setKeywords] = useState('');
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = useCallback((event) => {
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
          throw new Error('Invalid file content');
        }
        
        const rows = content.split('\n').filter(row => row.trim());
        if (rows.length < 2) {
          throw new Error('CSV must contain at least one data row after headers');
        }
        
        const headers = rows[0].split(',').map(h => h.trim());
        if (!headers.includes('keyword') || !headers.includes('volume') || !headers.includes('date')) {
          throw new Error('CSV must contain keyword, volume, and date columns');
        }
        
        setCsvData(rows);
        toast({
          title: 'Success',
          description: 'CSV data uploaded successfully',
          variant: 'default',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to process CSV: ${error.message}`,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, []);

  const analyzeTrends = async () => {
    if (!csvData && !keywords) {
      toast({
        title: 'Error',
        description: 'Please enter keywords or upload CSV data',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Process CSV data if uploaded
      let processedCsvData = csvData;
      
      if (typeof csvData === 'string') {
        processedCsvData = processCsvData(csvData);
      }
      
      const response = await fetch('/api/amazon/keyword-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim()),
          timeRange: parseInt(timeRange),
          csvData: processedCsvData
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trend data');
      }
      
      const data = await response.json();
      
      // Ensure we have data to render
      if (data && Object.keys(data).length > 0) {
        setChartData(data);
      } else {
        throw new Error('No trend data available to render');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="csv-upload">Upload Keyword Data (CSV)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload a CSV with columns: keyword, volume, date</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="cursor-pointer mb-4"
          />
        </div>
        <div>
          <Label htmlFor="keywords">Or Enter Keywords (comma separated)</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords to analyze"
          />
        </div>
        
        <div>
          <Label htmlFor="timeRange">Time Range (days)</Label>
          <Input
            id="timeRange"
            type="number"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            min="7"
            max="365"
          />
        </div>
        
        <Button onClick={analyzeTrends} disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze Trends'}
        </Button>
        
        {chartData && (
          <ChartContainer
            config={{
              keywords: {
                label: "Keyword Trends",
                theme: { light: "#10b981", dark: "#10b981" }
              }
            }}
            className="h-[400px]"
          >
            {(width, height) => (
              <LineChart width={width} height={height} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {keywords.split(',').map((keyword, index) => (
                  <Line
                    key={keyword.trim()}
                    type="monotone"
                    dataKey={keyword.trim()}
                    name={keyword.trim()}
                    stroke={`hsl(${index * 90}, 70%, 50%)`}
                  />
                ))}
              </LineChart>
            )}
          </ChartContainer>
        )}
      </div>
    </Card>
  );
}