import { z } from 'zod'

// Amazon Seller API Configuration
export const amazonSellerApiConfig = {
  // API Credentials - These should be loaded from environment variables
  credentials: {
    clientId: process.env.AMAZON_SELLER_CLIENT_ID || '',
    clientSecret: process.env.AMAZON_SELLER_CLIENT_SECRET || '',
    refreshToken: process.env.AMAZON_SELLER_REFRESH_TOKEN || '',
    region: process.env.AMAZON_SELLER_REGION || 'NA',
    sandbox: process.env.NODE_ENV !== 'production'
  },

  // Rate Limiting Settings
  rateLimits: {
    requestsPerSecond: 1,
    burstSize: 5,
    maxRetries: 3
  },

  // API Endpoints
  endpoints: {
    auth: 'https://api.amazon.com/auth/o2/token',
    baseUrl: (region: string) => `https://sellingpartnerapi-${region}.amazon.com`,
    fbaFees: '/fba/fees/v1/products',
    inventory: '/inventory/v1/products',
    pricing: '/pricing/v1/products'
  },

  // Validation Schemas
  schemas: {
    config: z.object({
      clientId: z.string().min(1, 'Client ID is required'),
      clientSecret: z.string().min(1, 'Client Secret is required'),
      refreshToken: z.string().min(1, 'Refresh Token is required'),
      region: z.enum(['NA', 'EU', 'FE']),
      sandbox: z.boolean().default(false)
    })
  }
}