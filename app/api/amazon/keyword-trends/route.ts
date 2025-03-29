import { NextResponse } from 'next/server';

function processCSVData(data: string[]) {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  const processedData = {};

  rows.forEach((row) => {
    const values = row.split(',');
    const keyword = values[headers.indexOf('keyword')];
    const volume = Number(values[headers.indexOf('volume')]);
    const date = values[headers.indexOf('date')];

    if (!processedData[keyword]) {
      processedData[keyword] = [];
    }
    processedData[keyword].push({ date, volume });
  });

  return processedData;
}

export async function POST(request: Request) {
  try {
    const { timeRange, csvData } = await request.json();
    let trendData = [];

    if (csvData) {
      const processedData = processCSVData(csvData);
      const dates = [
        ...new Set(csvData.slice(1).map((row) => row.split(',')[2])),
      ].sort();

      trendData = dates.map((date) => {
        const dataPoint = { name: date };
        Object.keys(processedData).forEach((keyword) => {
          const entry = processedData[keyword].find((e) => e.date === date);
          dataPoint[keyword] = entry ? entry.volume : 0;
        });
        return dataPoint;
      });
    } else if (keywords && keywords.length > 0) {
      // Generate trend data points for the specified time range
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - timeRange * 24 * 60 * 60 * 1000,
      );

      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const dataPoint = {
          name: d.toISOString().split('T')[0],
        };

        keywords.forEach((keyword) => {
          // Here you would typically fetch real trend data from a service
          // For now, we'll throw an error to prompt users to use CSV data
          throw new Error('Please upload CSV data for keyword trend analysis');
        });

        trendData.push(dataPoint);
      }
    } else {
      throw new Error('Please provide either keywords or CSV data');
    }

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Error processing keyword trends:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process keyword trends' },
      { status: 500 },
    );
  }
}
