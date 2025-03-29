import { useState } from 'react';
import { Card } from '../ui/card';
import { Chart } from '../ui/chart';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function KeywordTrendAnalyzer() {
  const [keywords, setKeywords] = useState('');
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState(null);

  const analyzeTrends = () => {
    // TODO: Implement API call to fetch keyword trend data
    // Mock data for now
    const mockData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: keywords.split(',').map((keyword, i) => ({
        label: keyword.trim(),
        data: Array(4).fill(0).map(() => Math.floor(Math.random() * 100)),
        borderColor: `hsl(${i * 90}, 70%, 50%)`,
        backgroundColor: `hsla(${i * 90}, 70%, 50%, 0.2)`,
      }))
    };
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
          <div className="h-[400px]">
            <Chart
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
              }}
              data={chartData}
            />
          </div>
        )}
      </div>
    </Card>
  );
}