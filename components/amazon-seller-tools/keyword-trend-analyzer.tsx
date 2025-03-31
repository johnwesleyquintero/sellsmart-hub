import React, { useState, useCallback } from 'react';
import CsvUploader from './CsvUploader';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  [key: string]: number | string;
}

const KeywordTrendAnalyzer: React.FC = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const handleFileUpload = useCallback(async (data: string | number[]) => {
    try {
      const response = await fetch('/api/amazon/keyword-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData: data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const trendData: ChartDataPoint[] = await response.json();
      setChartData(trendData);
    } catch (error: unknown) {
      console.error('Failed to process CSV data:', error);
    }
  }, []);

  return (
    <div>
      <CsvUploader onUpload={handleFileUpload} />
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(chartData[0])
              .filter((key) => key !== 'name')
              .map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`#${Math.floor(Math.random() * 16777215).toString(
                    16,
                  )}`}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default KeywordTrendAnalyzer;
