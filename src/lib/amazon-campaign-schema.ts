import { z } from 'zod';

const BiddingAdjustmentSchema = z.object({
  predicate: z.string(),
  percentage: z.number(),
});

const BiddingSchema = z.object({
  strategy: z.string(),
  adjustments: z.array(BiddingAdjustmentSchema).optional(),
});

export const CampaignSchema = z.object({
  campaignId: z.number(),
  name: z.string(),
  campaignType: z.string(),
  targetingType: z.string(),
  state: z.string(),
  dailyBudget: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  premiumBidAdjustment: z.boolean(),
  bidding: BiddingSchema,
  creationDate: z.string(),
  lastUpdatedDate: z.string(),
  servingStatus: z.string(),
});

export const CampaignDataSchema = z.object({
  campaigns: z.array(CampaignSchema),
  totalResults: z.number(),
  nextToken: z.string().optional(),
});
