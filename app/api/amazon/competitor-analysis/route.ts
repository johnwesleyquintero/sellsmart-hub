import { InventoryOptimizationError } from '@/lib/amazon-errors';
import { loadStaticData } from '@/lib/load-static-data';
import { z } from 'zod';
// Define stricter types for CSV data
interface CompetitorData {
  [key: string]: string | number;
  asin: string;
  price: number;
  reviews: number;
  rating: number;
  conversion_rate: number;
  click_through_rate: number;
}

// Type for processed metrics data
interface MetricsData {
  [metric: string]: number[];
}

function processCSVData(data: string[]): CompetitorData[] {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  return rows.map((row) => {
    const values = row.split(',');
    return headers.reduce<CompetitorData>((obj, header, i) => {
      // Initialize the object with default values for all required fields
      if (Object.keys(obj).length === 0) {
        obj.asin = '';
        obj.price = 0;
        obj.reviews = 0;
        obj.rating = 0;
        obj.conversion_rate = 0;
        obj.click_through_rate = 0;
      }
      obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
      return obj;
    }, {} as CompetitorData);
  });
}

export async function POST(request: Request) {
  const schema = z.object({
    asin: z.string().optional(),
    metrics: z.array(z.string()).optional(),
    sellerData: z.array(z.string()).optional(),
    competitorData: z.array(z.string()).optional(),
  });

  const parsedBody = schema.safeParse(await request.json());

  if (!parsedBody.success) {
    console.log(parsedBody.error.issues);
    return new Response(parsedBody.error.message, { status: 400 });
  }

  try {
    const { asin, metrics, sellerData, competitorData } = parsedBody.data;

    // Process uploaded CSV data
    const metricsData: MetricsData = {};

    if (sellerData && competitorData) {
      const sellerRows = processCSVData(sellerData);
      const competitorRows = processCSVData(competitorData);
      const allData = [...sellerRows, ...competitorRows];

      metrics?.forEach((metric: string) => {
        metricsData[metric] = allData.map((row) => row[metric] as number);
      });
    } else if (asin) {
      throw new Error('Please upload CSV data files for analysis');
    } else {
      throw new Error(
        'Please provide either CSV data files or an ASIN for analysis',
      );
    }

    const data = (await loadStaticData('case-studies')) ||
      [];

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    if (err instanceof InventoryOptimizationError) {
      return new Response(
        JSON.stringify({
          message: err.message,
          code: err.errorCode,
          details: err.details,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }
    return new Response(
      JSON.stringify({
        message:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}
