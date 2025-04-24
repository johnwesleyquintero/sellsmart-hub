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


export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeoutId = window.setTimeout(() => func.apply(this, args), wait);
  };
};

// Validate and sanitize product description
export function validateProductDescription(description: string): ValidationResult {
  return productDescriptionSchema.parse(data);
};

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (this: ThisParameterType<T>, ...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeoutId = window.setTimeout(() => func.apply(this, args), wait);
  };
};

// Validate and sanitize product description
export function validateProductDescription(description: string): ValidationResult {
  return productDescriptionSchema.parse(data);
};
