import { z } from "zod";

// Base schema for common fields across all report types
export const baseReportSchema = z.object({
  reportType: z.enum([
    "CAMPAIGN",
    "INVENTORY",
    "BUSINESS",
    "SEARCH_QUERY",
    "LISTING",
    "CUSTOM"
  ]),
  uploadDate: z.string().datetime(),
  fileName: z.string(),
  processingStatus: z.enum(["PENDING", "PROCESSING", "COMPLETED", "ERROR"]),
  errorMessage: z.string().optional(),
});

// Campaign report schema
export const campaignReportSchema = baseReportSchema.extend({
  reportType: z.literal("CAMPAIGN"),
  data: z.array(z.object({
    campaignId: z.string(),
    campaignName: z.string(),
    impressions: z.number(),
    clicks: z.number(),
    spend: z.number(),
    sales: z.number(),
    acos: z.number(),
    roas: z.number(),
    date: z.string(),
  })),
});

// Inventory report schema
export const inventoryReportSchema = baseReportSchema.extend({
  reportType: z.literal("INVENTORY"),
  data: z.array(z.object({
    sku: z.string(),
    asin: z.string(),
    productName: z.string(),
    condition: z.string(),
    quantity: z.number(),
    fulfillmentChannel: z.string(),
    unitPrice: z.number(),
    lastUpdated: z.string(),
  })),
});

// Business report schema
export const businessReportSchema = baseReportSchema.extend({
  reportType: z.literal("BUSINESS"),
  data: z.array(z.object({
    date: z.string(),
    orderedRevenue: z.number(),
    orderedUnits: z.number(),
    totalOrderItems: z.number(),
    averageSellingPrice: z.number(),
    averageUnitSold: z.number(),
    returnRate: z.number(),
    refundRate: z.number(),
  })),
});

// Search Query Performance report schema
export const searchQueryReportSchema = baseReportSchema.extend({
  reportType: z.literal("SEARCH_QUERY"),
  data: z.array(z.object({
    customerSearchTerm: z.string(),
    impressions: z.number(),
    clicks: z.number(),
    ctr: z.number(),
    conversion: z.number(),
    spend: z.number(),
    sales: z.number(),
    acos: z.number(),
  })),
});

// Listing report schema
export const listingReportSchema = baseReportSchema.extend({
  reportType: z.literal("LISTING"),
  data: z.array(z.object({
    sku: z.string(),
    asin: z.string(),
    productName: z.string(),
    price: z.number(),
    category: z.string(),
    rank: z.number().optional(),
    buyBoxOwner: z.boolean(),
    listingStatus: z.string(),
  })),
});

// Custom report schema for flexible data structure
export const customReportSchema = baseReportSchema.extend({
  reportType: z.literal("CUSTOM"),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  headers: z.array(z.string()),
});

// Union type for all report types
export const reportSchema = z.discriminatedUnion("reportType", [
  campaignReportSchema,
  inventoryReportSchema,
  businessReportSchema,
  searchQueryReportSchema,
  listingReportSchema,
  customReportSchema,
]);

// Infer TypeScript types from schemas
export type BaseReport = z.infer<typeof baseReportSchema>;
export type CampaignReport = z.infer<typeof campaignReportSchema>;
export type InventoryReport = z.infer<typeof inventoryReportSchema>;
export type BusinessReport = z.infer<typeof businessReportSchema>;
export type SearchQueryReport = z.infer<typeof searchQueryReportSchema>;
export type ListingReport = z.infer<typeof listingReportSchema>;
export type CustomReport = z.infer<typeof customReportSchema>;
export type Report = z.infer<typeof reportSchema>;