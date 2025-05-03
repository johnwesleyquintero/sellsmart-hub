import { CampaignDataSchema } from '@/lib/amazon-campaign-schema';
import { validateRequest } from '@/lib/api-validation';
import { monitor } from '@/lib/monitoring';
import { rateLimiter } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

// Fetch listing data from Amazon Advertising API
export async function GET(
  request: Request,
  { params }: { params: { asin: string } },
) {
  const asin = params.asin;

  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiter.limit();
    if (!rateLimitResult.success) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }

    // Get the Amazon API key from environment variables
    const apiKey = process.env.AMAZON_API_KEY;
    if (!apiKey) {
      throw new Error('AMAZON_API_KEY environment variable not set.');
    }

    // Construct the API request URL
    const apiUrl = `https://amazon.api.example.com/v2/campaigns?asin=${asin}`;

    // Record the start time
    const startTime = Date.now();

    // Make the API call with the Authorization header
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    // Check if the response was successful
    if (!response.ok) {
      throw new Error(
        `Amazon API request failed with status ${response.status}`,
      );
    }

    // Parse the JSON response
    const data = await response.json();

    // Record the end time
    const endTime = Date.now();

    // Calculate the duration
    const duration = endTime - startTime;

    // Report the duration
    monitor.reportMetric('amazonApiRequestDuration', duration);

    // Validate the data using the CampaignDataSchema
    const validatedData = validateRequest(CampaignDataSchema, data);

    // Return the validated data in a NextResponse
    return NextResponse.json(validatedData);
  } catch (error: unknown) {
    console.error('Error fetching Amazon data:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
