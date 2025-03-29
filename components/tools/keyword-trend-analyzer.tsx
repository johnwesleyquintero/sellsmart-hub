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
import Papa from 'papaparse';

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

        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              throw new Error(`CSV errors: ${results.errors.map(e => e.message).join(', ')}`);
            }

            const requiredFields = ['keyword', 'date', 'search_volume', 'ranking'];
            const missingFields = requiredFields.filter(f => !results.meta.fields.includes(f));
            if (missingFields.length > 0) {
              throw new Error(`Missing columns: ${missingFields.join(', ')}`);
            }

            const processedData = results.data.map(row => ({
              keyword: row.keyword,
              date: new Date(row.date),
              search_volume: Number(row.search_volume),
              ranking: Number(row.ranking)
            }));

            setCsvData(processedData);
            toast({
              title: 'Success',
              description: `${file.name} processed successfully`,
              variant: 'default',
            });
          }
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: `CSV processing failed: ${error.message}`,
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, []);

  const processCsvData = (csvContent) => {
    try {
      const rows = csvContent.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',').map(h => h.trim());
      return rows.slice(1).map(row => {
        const values = row.split(',');
        return {
          keyword: values[headers.indexOf('keyword')].trim(),
          volume: parseInt(values[headers.indexOf('volume')], 10),
          date: new Date(values[headers.indexOf('date')])
        };
      });
    } catch (error) {
      toast({
        title: 'CSV Processing Error',
        description: 'Failed to parse CSV content: ' + error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const analyzeTrends = useCallback(async () => {
    setIsLoading(true);
    try {
      const processedData = csvData;
      
      if (!processedData || processedData.length === 0) {
        throw new Error('No valid data to analyze');
      }
      
      // Transform CSV data for visualization
      const formattedData = processedData.reduce((acc, { keyword, date, search_volume, ranking }) => {
        const dateKey = date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey };
        }
        acc[dateKey][`${keyword}_volume`] = search_volume;
        acc[dateKey][`${keyword}_rank`] = ranking;
        return acc;
      }, {});

      const chartData = Object.values(formattedData);
      
      if (chartData.length === 0) {
        throw new Error('Failed to generate chart data');
      }
      
      setChartData(chartData);
      
      toast({
        title: 'Analysis Complete',
        description: `Trend visualization for ${chartData.length} days generated`,
        variant: 'default',
      });

    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }, [csvData]);

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
              <LineChart width={width} height={height} data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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