import { NextResponse } from 'next/server';

function processCSVData(data: string[]) {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  return rows.map((row) => {
    const values = row.split(',');
    return headers.reduce(
      (obj, header, i) => {
        obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
        return obj;
      },
      {} as Record<string, string | number>,
    );
  });
}

export async function POST(request: Request) {
  try {
    const { asin, metrics, sellerData, competitorData } = await request.json();

    // Process uploaded CSV data
    let competitors = [];
    const metricsData: Record<string, number[]> = {};

    if (sellerData && competitorData) {
      const sellerRows = processCSVData(sellerData);
      const competitorRows = processCSVData(competitorData);
      const allData = [...sellerRows, ...competitorRows];

      competitors = allData.map((row) => row.asin as string);
      metrics.forEach((metric: string) => {
        metricsData[metric] = allData.map((row) => row[metric] as number);
      });
    } else if (asin) {
      throw new Error('Please upload CSV data files for analysis');
    } else {
      throw new Error(
        'Please provide either CSV data files or an ASIN for analysis',
      );
    }

    return NextResponse.json({
      competitors,
      metrics: metricsData,
    });
  } catch (error) {
    console.error('Error processing competitor analysis:', error);
    return NextResponse.json(
      { error: 'Failed to process competitor analysis' },
      { status: 500 },
    );
  }
}
