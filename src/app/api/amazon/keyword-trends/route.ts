import { KeywordTrend, KeywordTrendCollection, KeywordTrendData } from '@/lib/models/keyword-trends';
import { connectToDatabase } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

function processCSVData(data: string[]): KeywordTrend[] {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  const trends: KeywordTrend[] = [];

  rows.forEach((row) => {
    const values = row.split(',');
    const volume = Number(values[headers.indexOf('volume')]);
    const date = values[headers.indexOf('date')];
    const keyword = values[headers.indexOf('keyword')];

    trends.push({
      keyword,
      date,
      volume,
      createdAt: new Date()
    });
  });

  return trends;
}

export async function POST(request: Request) {
  try {
    const { csvData } = (await request.json()) as { csvData: string[] };
    let trendData: KeywordTrendData[] = [];

    if (csvData.length === 0) {
      throw new Error(
        'Please provide valid CSV data for keyword trend analysis',
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(KeywordTrendCollection);
    
    // Process and store the data
    const trends = processCSVData(csvData);
    await collection.insertMany(trends);

    // Retrieve and format the data
    const dates = [...new Set(trends.map(t => t.date))].sort();
    const keywords = [...new Set(trends.map(t => t.keyword))];

    trendData = await Promise.all(dates.map(async (date) => {
      const dataPoint: KeywordTrendData = { name: date };
      const dateEntries = await collection
        .find({ date })
        .toArray();

      keywords.forEach((keyword) => {
        const entry = dateEntries.find(e => e.keyword === keyword);
        dataPoint[keyword] = entry ? entry.volume : 0;
      });
      return dataPoint;
    }));

    return NextResponse.json(trendData);
  } catch (error) {
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
