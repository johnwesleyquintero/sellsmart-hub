import { handleApiError } from '../api/error-handler';
import { logger } from '../api/logger';
import { monitorApiResponseTime } from '../api/monitoring';
import { retryRequest } from '../api/retry';

interface ApiClientOptions {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  listingDataEndpoint?: string;
}

class ApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;
  private listingDataEndpoint?: string;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000; // Default 30s timeout
    this.listingDataEndpoint = options.listingDataEndpoint;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const startTime = Date.now();
    logger.info(`API Request: ${endpoint}`, {
      url: `${this.baseUrl}${endpoint}`,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    });

    try {
      const response = await retryRequest(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'X-Api-Key': this.apiKey }),
            ...options.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText} - ${endpoint}`,
          );
        }

        return response;
      });

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info(`API Response: ${endpoint}`, {
        url: `${this.baseUrl}${endpoint}`,
        status: response.status,
        responseTime: responseTime,
        data: data,
      });

      await monitorApiResponseTime(`${this.baseUrl}${endpoint}`, responseTime);

      return data;
    } catch (error: any) {
      handleApiError(error, { url: endpoint, method: options.method }, null);
      throw error;
    }
  }

  // Keyword Intelligence API
  async analyzeKeywords(keywords: string[]): Promise<
    {
      keyword: string;
      searchVolume: number;
      competition: number;
      trend: number[];
    }[]
  > {
    return this.request('/keywords/analyze', {
      method: 'POST',
      body: JSON.stringify({ keywords }),
    });
  }

  // ASIN Data API
  async getAsinData(asin: string): Promise<{
    title: string;
    description: string;
    category: string;
    price: number;
    rating: number;
    reviewCount: number;
    bsr: number;
  }> {
    return this.request(`/asin/${asin}`);
  }

  // Competition Analysis API
  async analyzeCompetition(asin: string): Promise<{
    competitors: Array<{
      asin: string;
      price: number;
      rating: number;
      reviewCount: number;
      bsr: number;
    }>;
    marketMetrics: {
      averagePrice: number;
      averageRating: number;
      averageReviewCount: number;
      competitionLevel: 'low' | 'medium' | 'high';
    };
  }> {
    return this.request(`/competition/${asin}`);
  }

  // Sales Estimation API
  async estimateSales(params: {
    category: string;
    bsr: number;
    price: number;
  }): Promise<{
    estimatedMonthlySales: number;
    confidence: number;
    range: { min: number; max: number };
  }> {
    return this.request('/sales/estimate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Listing Data API
  async getListingData(asin: string): Promise<any> {
    if (!this.listingDataEndpoint) {
      throw new Error('Listing data endpoint is not configured.');
    }
    return this.request(`${this.listingDataEndpoint}/${asin}`);
  }
}

// PPC Campaign Auditor API
async getCampaignData(
  params: {
    portfolioId?: number;
    campaignId?: number;
    adGroupId?: number;
    keywordId?: number;
    startDate: string;
    endDate: string;
  }
): Promise<any> {
  return this.request('/ppc/campaign-data', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
155 |
// Create and export a singleton instance

const apiKey = process.env.NEXT_PUBLIC_API_KEY;
if (!apiKey) {
  console.warn('NEXT_PUBLIC_API_KEY is not set. API requests may fail.');
}

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
  apiKey: apiKey,
  listingDataEndpoint: process.env.NEXT_PUBLIC_LISTING_DATA_ENDPOINT,
});
