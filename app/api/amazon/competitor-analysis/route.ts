import { NextResponse } from 'next/server';

function processCSVData(data: string[]) {
  const headers = data[0].split(',').map(h => h.trim());
  const rows = data.slice(1);
  return rows.map(row => {
    const values = row.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
      return obj;
    }, {} as Record<string, string | number>);
  });
}

export async function POST(request: Request) {
  try {
    const { asin, metrics, sellerData, competitorData } = await request.json();

    // Process uploaded CSV data
    let competitors = [];
    let metricsData: Record<string, number[]> = {};

    if (sellerData && competitorData) {
      const sellerRows = processCSVData(sellerData);
      const competitorRows = processCSVData(competitorData);
      const allData = [...sellerRows, ...competitorRows];

      competitors = allData.map(row => row.asin as string);
      metrics.forEach(metric => {
        metricsData[metric] = allData.map(row => row[metric] as number);
      });
    } else if (asin) {
      // Mock data for demonstration when only ASIN is provided
      competitors = [asin, 'COMP1', 'COMP2', 'COMP3'];
      metrics.forEach(metric => {
        metricsData[metric] = Array(4).fill(0).map(() => Math.random() * 100);
        
        // Adjust values based on metric type
        if (metric === 'rating') {
          metricsData[metric] = metricsData[metric].map(v => (v % 5) + 1);
        } else if (metric.includes('rate')) {
          metricsData[metric] = metricsData[metric].map(v => v / 100);
        } else if (metric === 'price') {
          metricsData[metric] = metricsData[metric].map(v => v + 10);
        }
      });
    }

    return NextResponse.json({
      competitors,
      metrics: metricsData
    });
  } catch (error) {
    console.error('Error processing competitor analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process competitor analysis' },
      { status: 500 }
    );
  }
}