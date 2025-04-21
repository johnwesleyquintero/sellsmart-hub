import { ProductCategory } from '@/lib/amazon-types';
import {
  monetaryValueSchema,
  percentageSchema,
  positiveNumberSchema,
} from '@/lib/input-validation';
import { z } from 'zod';

// Schema for optimal price calculator inputs
export const optimalPriceInputSchema = z.object({
  cost: monetaryValueSchema,
  currentPrice: monetaryValueSchema,
  competitorPrices: z
    .string()
    .transform((val) => val.split(',').map((p) => parseFloat(p.trim())))
    .refine(
      (prices) => prices.length > 0 && prices.every((p) => !isNaN(p) && p >= 0),
      {
        message:
          'Please enter at least one valid competitor price (comma-separated numbers)',
      },
    ),
  reviewRating: percentageSchema
    .min(0, 'Review rating must be between 0 and 5')
    .max(5, 'Review rating must be between 0 and 5')
    .optional()
    .default(0),
  reviewCount: positiveNumberSchema.optional().default(0),
  priceCompetitiveness: percentageSchema.optional().default(0),
  inventoryHealth: percentageSchema.optional().default(0),
  weight: positiveNumberSchema.optional().default(0),
  volume: positiveNumberSchema.optional().default(0),
  reviews: positiveNumberSchema.nullable().optional(),
  salesRank: positiveNumberSchema.optional().default(0),
  price: monetaryValueSchema.optional().default(0),
  category: z.nativeEnum(ProductCategory),
});

export type OptimalPriceInputs = z.infer<typeof optimalPriceInputSchema>;

// Helper function to validate optimal price inputs
export const validateOptimalPriceInputs = (data: unknown) => {
  try {
    return {
      success: true,
      data: optimalPriceInputSchema.parse(data),
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: error.errors[0].message,
      };
    }
    return {
      success: false,
      data: null,
      error: 'Invalid input data',
    };
  }
};
