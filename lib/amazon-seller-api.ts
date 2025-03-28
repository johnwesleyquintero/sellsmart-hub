import { RateLimiter } from "@/lib/rate-limiter";
import { z } from "zod";

// Amazon Seller API Configuration Schema
const SellerApiConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  refreshToken: z.string(),
  region: z.enum(["NA", "EU", "FE"]),
  sandbox: z.boolean().default(false),
});

type SellerApiConfig = z.infer<typeof SellerApiConfigSchema>;

type Region = "NA" | "EU" | "FE";

interface AmazonSellerApiConfig {
  sandbox: boolean;
  region: Region;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

// Rate Limiting Configuration
const DEFAULT_RATE_LIMIT = {
  requestsPerSecond: 1,
  burstSize: 5,
  maxRetries: 3,
};

// Error Types
export class AmazonSellerApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
  ) {
    super(message);
    this.name = "AmazonSellerApiError";
  }
}

// API Response Types
export interface FBAFeeResponse {
  asin: string;
  fbaFees: {
    storageFee: number;
    fulfillmentFee: number;
    commissionFee: number;
    totalFees: number;
  };
}

export interface InventoryResponse {
  asin: string;
  fnsku: string;
  condition: string;
  quantity: number;
  inboundQuantity: number;
  reservedQuantity: number;
}

export interface PricingResponse {
  asin: string;
  lowestPrice: number;
  buyBoxPrice: number;
  competitorCount: number;
}

// Amazon Seller API Client
export class AmazonSellerApi {
  private config: SellerApiConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private rateLimiter: RateLimiter;

  constructor(config: SellerApiConfig) {
    this.config = SellerApiConfigSchema.parse(config);
    this.rateLimiter = new RateLimiter({
      maxTokens: DEFAULT_RATE_LIMIT.burstSize,
      refillRate: DEFAULT_RATE_LIMIT.requestsPerSecond,
      refillInterval: 1000,
    });
  }

  private async refreshAccessToken(): Promise<void> {
    // Implement OAuth2 token refresh logic
    // This is a placeholder implementation
    try {
      const response = await fetch("https://api.amazon.com/auth/o2/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new AmazonSellerApiError(
          "Failed to refresh access token",
          response.status,
        );
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
    } catch (error) {
      throw new AmazonSellerApiError("Token refresh failed: " + error.message);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = "GET",
    body?: unknown,
  ): Promise<T> {
    try {
      if (!this.accessToken || Date.now() >= this.tokenExpiry) {
        await this.refreshAccessToken();
      }

      await this.rateLimiter.acquire();

      const response = await fetch(
        `https://sellingpartnerapi-${this.config.region}.amazon.com${endpoint}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: body ? JSON.stringify(body) : undefined,
        },
      );

      if (!response.ok) {
        throw new AmazonSellerApiError(
          `API request failed with status ${response.status}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new AmazonSellerApiError(`Request failed: ${error.message}`);
      }
      throw new AmazonSellerApiError("An unknown error occurred");
    }
  }

  // Public API Methods
  async getFBAFees(asin: string): Promise<FBAFeeResponse> {
    return this.makeRequest<FBAFeeResponse>(`/fba/fees/v1/products/${asin}`);
  }

  async getInventory(asin: string): Promise<InventoryResponse> {
    return this.makeRequest<InventoryResponse>(
      `/inventory/v1/products/${asin}`,
    );
  }

  async getPricing(asin: string): Promise<PricingResponse> {
    return this.makeRequest<PricingResponse>(`/pricing/v1/products/${asin}`);
  }

  // Batch Operations
  async batchGetFBAFees(asins: string[]): Promise<FBAFeeResponse[]> {
    return this.makeRequest<FBAFeeResponse[]>("/fba/fees/v1/products", "POST", {
      asins,
    });
  }

  async batchGetInventory(asins: string[]): Promise<InventoryResponse[]> {
    return this.makeRequest<InventoryResponse[]>(
      "/inventory/v1/products",
      "POST",
      { asins },
    );
  }

  async batchGetPricing(asins: string[]): Promise<PricingResponse[]> {
    return this.makeRequest<PricingResponse[]>("/pricing/v1/products", "POST", {
      asins,
    });
  }
}
