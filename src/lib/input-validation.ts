import { z } from 'zod';

// Validation schemas for monetary values and numbers
export const monetaryValueSchema = z
  .number()
  .min(0, 'Value must be non-negative')
  .max(1000000, 'Value exceeds maximum limit');

export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be between 0 and 100')
  .max(100, 'Percentage must be between 0 and 100');

export const positiveNumberSchema = z
  .number()
  .positive('Value must be positive');

export const numberSchema = z.number();

// CSV content validation
import { logger } from './logger';

export const validateCsvContent = (
  content: unknown[],
): { validRows: Record<string, unknown>[]; errors: string[] } => {
  logger.debug('validateCsvContent: Input content:', { content });
  const errors: string[] = [];
  const validRows = content.filter((row, index) => {
    if (!row || typeof row !== 'object') {
      errors.push(`Row ${index + 1}: Invalid row format`);
      return false;
    }
    return true;
  }) as Record<string, unknown>[];
  logger.debug('validateCsvContent: Valid rows:', { validRows });
  logger.debug('validateCsvContent: Errors:', { errors });
  return { validRows, errors };
};

// Define asinSchema and productNameSchema
export const asinSchema = z
  .string()
  .regex(/^[A-Z0-9]{10}$/, 'Invalid ASIN format');
export const productNameSchema = z
  .string()
  .min(3, 'Product name must be at least 3 characters');

// Keyword validation
export const validateKeywords = (keywords: string[]): string[] => {
  const errors: string[] = [];
  if (!keywords || keywords.length === 0) {
    errors.push('Keywords cannot be empty');
  }

  if (!keywords.every((keyword) => typeof keyword === 'string')) {
    errors.push('Each keyword must be a string');
  }
  return errors;
};
