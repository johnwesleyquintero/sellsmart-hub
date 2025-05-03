// use client
console.log('use-form-validation.ts loaded');
('use client');

import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface ValidationOptions<T> {
  schema: z.ZodSchema<T>; // Changed from string to proper schema type
  onError?: (error: z.ZodError) => void;
  trackingId?: string;
}

interface ValidationResult<T> {
  isValid: boolean;
  errors: z.ZodError | null;
  validatedData: T | null;
}

export function useFormValidation<T>({
  schema,
  onError,
  trackingId = 'form',
}: ValidationOptions<T>) {
  const [validationResult, setValidationResult] = useState<ValidationResult<T>>(
    {
      isValid: false,
      errors: null,
      validatedData: null,
    },
  );

  const validate = useCallback(
    (data: unknown) => {
      const startTime = performance.now();
      try {
        const validatedData = schema.parse(data);
        const validationTime = performance.now() - startTime;

        analytics.trackPerformance(
          `${trackingId}_validation_time`,
          validationTime,
        );
        analytics.track(`${trackingId}_validation_success`, {
          validationTime,
          fieldCount: Object.keys(data as object).length,
        });

        setValidationResult({
          isValid: true,
          errors: null,
          validatedData,
        });

        return validatedData;
      } catch (error: unknown) {
        const validationTime = performance.now() - startTime;

        // Type narrowing for error handling
        if (error instanceof z.ZodError) {
          analytics.track(`${trackingId}_validation_error`, {
            validationTime,
            errorCount: error.errors.length,
            errors: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          });

          logger.debug(`Form validation error in ${trackingId}:`, {
            errors: error.errors,
            data,
          });

          setValidationResult({
            isValid: false,
            errors: error,
            validatedData: null,
          });

          onError?.(error);
        } else if (error instanceof Error) {
          logger.error('Validation error:', error);
        }

        throw error;
      }
    },
    [schema, onError, trackingId],
  );

  const validateField = useCallback(
    (field: string, value: unknown) => {
      try {
        const fieldSchema =
          schema instanceof z.ZodObject ? schema.shape[field] : undefined;
        if (!fieldSchema) {
          throw new Error(`No schema found for field: ${field}`);
        }

        fieldSchema.parse(value);
        return { isValid: true, error: null };
      } catch (error) {
        if (error instanceof z.ZodError) {
          analytics.track(`${trackingId}_field_validation_error`, {
            field,
            error: error.errors[0]?.message,
          });

          return {
            isValid: false,
            error: error.errors[0]?.message,
          };
        }
        return { isValid: false, error: 'Invalid field value' };
      }
    },
    [schema, trackingId],
  );

  return {
    validate,
    validateField,
    ...validationResult,
  };
}
