import { useState } from 'react';
import { Card } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function KeywordTrendAnalyzer() {
  const [keywords, setKeywords] = useState('');
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState(null);

  const analyzeTrends = () => {
    // TODO: Implement API call to fetch keyword trend data
    // Mock data for now
    const mockData = keywords.split(',').map((keyword, i) => ({
      name: 'Week ' + (i + 1),
      ...keywords.split(',').reduce((acc, k) => ({
        ...acc,
        [k.trim()]: Math.floor(Math.random() * 100)
      }), {})
    }));
    setChartData(mockData);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="keywords">Keywords (comma separated)</Label>
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
        
        <Button onClick={analyzeTrends}>Analyze Trends</Button>
        
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