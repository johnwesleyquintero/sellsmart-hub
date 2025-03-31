import { NextResponse } from 'next/server';

interface TrendEntry {
  date: string;
  volume: number;
}

interface ProcessedData {
  [keyword: string]: TrendEntry[];
}

function processCSVData(data: string[]) {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  const processedData: ProcessedData = {};

  rows.forEach((row) => {
    const values = row.split(',');
    const volume = Number(values[headers.indexOf('volume')]);
    const date = values[headers.indexOf('date')];
    const keyword = values[headers.indexOf('keyword')];

    if (!processedData[keyword]) {
      processedData[keyword] = [];
    }
    processedData[keyword].push({ date, volume });
  });

  return processedData;
}

export async function POST(request: Request) {
  try {
    const { csvData } = (await request.json()) as { csvData: string[] };
    let trendData: { name: string;[key: string]: any }[] = [];

    if (csvData) {
      const processedData = processCSVData(csvData);
      const dates = [
        ...new Set(csvData.slice(1).map((row) => row.split(',')[2])),
      ].sort();

      trendData = dates.map((date) => {
        const dataPoint: { name: string;[key: string]: number | string } = {
          name: date,
        };
        Object.keys(processedData).forEach((keyword) => {
          const entry = processedData[keyword].find((e) => e.date === date);
          dataPoint[keyword] = entry ? entry.volume : 0;
        });
        return dataPoint;
      });
    } else {
      throw new Error('Please provide CSV data for keyword trend analysis');
    }

    return NextResponse.json(trendData);
  } catch (error: any) {
    console.error('Error processing keyword trends:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process keyword trends',
      },
      { status: 500 },
    );
  }
}
