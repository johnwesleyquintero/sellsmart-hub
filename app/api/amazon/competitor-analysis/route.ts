import { InventoryOptimizationError } from '@/lib/amazon-errors';
import { loadStaticData } from '@/lib/load-static-data';
import { z } from 'zod';

interface CompetitorData {
  [key: string]: string | number;
}

function processCSVData(data: string[]): Record<string, string | number>[] {
  const headers = data[0].split(',').map((h) => h.trim());
  const rows = data.slice(1);
  return rows.map((row) => {
    const values = row.split(',');
    return headers.reduce<Record<string, string | number>>(
      (obj: Record<string, string | number>, header: string, i: number) => {
        obj[header] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
        return obj;
      },
      {}
    );
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
    const metricsData: Record<string, number[]> = {};

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

    const data = (await loadStaticData<CompetitorData[]>('case-studies')) || [];
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
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
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
