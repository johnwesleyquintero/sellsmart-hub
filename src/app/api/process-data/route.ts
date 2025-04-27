import { findCanonicalName } from '@/lib/config/headerMappings';
import ReportData from '@/types/amazon-report';
import { parse as parseDate } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import Papa, { ParseResult } from 'papaparse';

type ProcessedData<T = ReportData> = {
  status: 'success' | 'error' | 'partial';
  data?: T[];
  message?: string;
  warnings?: string[];
};

type ApiResponse = {
  sources: {
    sqp?: ProcessedData<ReportData>;
    business?: ProcessedData<ReportData>;
    ads?: ProcessedData<ReportData>;
  };
  joinedData?: ProcessedData<ReportData>;
};

/**
 * Processes a CSV file and maps headers to canonical names
 */
async function processFile(
  file: File,
  reportType: 'sqp' | 'business',
): Promise<ProcessedData<ReportData>> {
  const fileContent = await file.text();
  const warnings: string[] = [];

  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, unknown>>) => {
        const headers = results.meta.fields || [];
        const headerMap = new Map<string, string>();

        // Map headers to canonical names
        headers.forEach((header: string) => {
          const canonicalName = findCanonicalName(header);
          if (canonicalName) {
            headerMap.set(header, canonicalName);
          } else {
            warnings.push(`Unrecognized header: ${header}`);
          }
        });

        // Check for required headers
        const requiredHeadersMap: { [key: string]: string[] } = {
          sqp: ['asin', 'keyword', 'upc', 'sku', 'date'],
          business: ['asin', 'keyword', 'upc', 'sku', 'date'],
        };

        let requiredHeaders = requiredHeadersMap[reportType] || [];
        let missingHeaders = requiredHeaders.filter(
          (required) => !Array.from(headerMap.values()).includes(required),
        );

        if (missingHeaders.length > 0) {
          console.warn(
            `Missing required headers: ${missingHeaders.join(', ')}. Attempting to create a composite key.`,
          );
          requiredHeaders = []; // Clear requiredHeaders to avoid error
          missingHeaders = []; // Clear missingHeaders to avoid error
        }

        if (missingHeaders.length > 0) {
          return resolve({
            status: 'error',
            message: `Missing required headers: ${missingHeaders.join(', ')}`,
          });
        }

        // Transform data using canonical names
        const transformedData = results.data.map(
          (row: Record<string, unknown>): ReportData => {
            const transformedRow: ReportData = {};
            console.log({ row });

            Object.entries(row).forEach(([header, value]) => {
              const canonicalName = headerMap.get(header);
              if (canonicalName) {
                // Clean and transform data
                if (canonicalName === 'date') {
                  try {
                    transformedRow[canonicalName] = parseDate(
                      value as string,
                      'yyyy-MM-dd',
                      new Date(),
                    );
                  } catch (e) {
                    warnings.push(
                      `Invalid date format in row: ${JSON.stringify(row)}`,
                    );
                    transformedRow[canonicalName] = null as any;
                  }
                } else if (
                  ['cost', 'sales', 'units', 'clicks'].includes(canonicalName)
                ) {
                  if (typeof value === 'string') {
                    transformedRow[canonicalName] = parseFloat(value) || 0;
                  } else {
                    transformedRow[canonicalName] = value || 0;
                  }
                } else {
                  transformedRow[canonicalName] = value;
                }
              }
            });

            return transformedRow;
          },
        );

        resolve({
          status: warnings.length > 0 ? 'partial' : 'success',
          data: transformedData,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
      },
      error: (error: Error) => {
        console.log({ error });
        resolve({
          status: 'error',
          message: `Failed to parse CSV: ${error.message}`,
        });
      },
    });
  });
}

/**
 * Joins SQP and Business report data on date and ASIN
 */
function joinData(
  sqpData: ReportData[],
  businessData: ReportData[],
): ReportData[] {
  return sqpData.map((sqpRow: ReportData): ReportData => {
    console.log({ sqpData, businessData });
    const matchingBusinessRow = businessData.find(
      (businessRow) =>
        businessRow.date?.getTime() === sqpRow.date?.getTime() &&
        businessRow.asin === sqpRow.asin,
    );

    return {
      ...sqpRow,
      ...matchingBusinessRow,
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sqpFile = formData.get('sqpReport') as File | null;
    const businessFile = formData.get('businessReport') as File | null;

    const response: ApiResponse = {
      sources: {},
    };

    // Process SQP Report
    if (sqpFile) {
      response.sources.sqp = await processFile(sqpFile, 'sqp');
    }

    // Process Business Report
    if (businessFile) {
      response.sources.business = await processFile(businessFile, 'business');
    }

    // Join data if both sources are available and successful
    if (
      response.sources.sqp?.status === 'success' &&
      response.sources.business?.status === 'success' &&
      response.sources.sqp.data &&
      response.sources.business.data
    ) {
      if (response.sources.sqp.data && response.sources.business.data) {
        const joinedData = joinData(
          response.sources.sqp.data,
          response.sources.business.data,
        );

        response.joinedData = {
          status: 'success',
          data: joinedData,
        };
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}
