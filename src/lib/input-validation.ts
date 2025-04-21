import { z } from 'zod';

// Common validation schemas
export const numberSchema = z
  .number()
  .min(-999999999, 'Value is too small')
  .max(999999999, 'Value is too large');

export const positiveNumberSchema = numberSchema.positive(
  'Value must be positive',
);

export const percentageSchema = numberSchema
  .min(0, 'Percentage must be between 0 and 100')
  .max(100, 'Percentage must be between 0 and 100');

export const productNameSchema = z
  .string()
  .min(1, 'Product name is required')
  .max(200, 'Product name is too long')
  .regex(/^[\w\s\-\.,'&]+$/, 'Product name contains invalid characters');

export const asinSchema = z
  .string()
  .length(10, 'ASIN must be exactly 10 characters')
  .regex(/^[A-Z0-9]+$/, 'ASIN must contain only uppercase letters and numbers');

export const monetaryValueSchema = z
  .number()
  .min(0, 'Value cannot be negative')
  .max(999999999, 'Value is too large')
  .transform((val) => Number(val.toFixed(2)));

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date');

// Validation helper functions
export const validateNumber = (
  value: unknown,
  options?: { min?: number; max?: number },
): number => {
  const schema = z
    .number()
    .min(options?.min ?? -999999999)
    .max(options?.max ?? 999999999);
  return schema.parse(value);
};

export const validateString = (
  value: unknown,
  options?: { minLength?: number; maxLength?: number },
): string => {
  const schema = z
    .string()
    .min(options?.minLength ?? 0)
    .max(options?.maxLength ?? 1000);
  return schema.parse(value);
};

export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// CSV validation
export const validateCsvHeaders = (
  headers: string[],
  requiredHeaders: string[],
): boolean => {
  return requiredHeaders.every((required) => headers.includes(required));
};

export const validateCsvRow = (
  row: Record<string, unknown>,
  schema: z.ZodSchema,
): boolean => {
  try {
    schema.parse(row);
    return true;
  } catch {
    return false;
  }
};
