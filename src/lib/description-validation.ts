import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';
import { asinSchema, productNameSchema } from './input-validation';

// Description validation schema
export const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(5000, 'Description is too long')
  .transform((val) =>
    DOMPurify.sanitize(val, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'ul', 'ol', 'li', 'br'],
      ALLOWED_ATTR: [],
    }),
  );

// Product description validation schema
export const productDescriptionSchema = z.object({
  product: productNameSchema,
  asin: asinSchema.optional(),
  description: descriptionSchema,
});

// Debounce function for performance optimization

// Validate and sanitize product description
export interface ValidationResult {
  success: boolean;
  data?: z.infer<typeof productDescriptionSchema>;
  error?: z.ZodError;
}

export function validateProductDescription(
  description: string,
): ValidationResult {
  try {
    const result = productDescriptionSchema.parse({
      description: description,
    });
    const prohibitedKeywords = [
      'counterfeit',
      'fake',
      'replica',
      'knockoff',
      'unauthorized',
      'unauthorized seller',
    ];
    const containsProhibitedKeyword = prohibitedKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword.toLowerCase()),
    );
    if (containsProhibitedKeyword) {
      console.log('Description contains prohibited keyword(s)!');
    }
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error as z.ZodError };
  }
}
