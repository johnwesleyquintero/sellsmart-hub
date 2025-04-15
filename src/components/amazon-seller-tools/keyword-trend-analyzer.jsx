var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
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
const KeywordTrendAnalyzer = () => {
  const [chartData, setChartData] = useState([]);
  const handleFileUpload = useCallback(
    (data) =>
      __awaiter(void 0, void 0, void 0, function* () {
        try {
          const response = yield fetch('/api/amazon/keyword-trends', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ csvData: data }),
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const trendData = yield response.json();
          setChartData(trendData);
        } catch (error) {
          console.error('Failed to process CSV data:', error);
        }
      }),
    [],
  );
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
                  stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
export default KeywordTrendAnalyzer;
