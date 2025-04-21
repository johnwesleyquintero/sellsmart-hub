import Papa from 'papaparse';
import { z } from 'zod';
import { logError } from './error-handling';

interface CsvParserOptions<T> {
  requiredHeaders: string[];
  validateRow: (row: Record<string, unknown>) => T;
  onError?: (error: Error) => void;
  onComplete?: (result: {
    data: T[];
    skippedRows: Array<{ index: number; reason: string }>;
  }) => void;
}

export const parseCsvFile = async <T>(
  file: File,
  options: CsvParserOptions<T>,
): Promise<{
  data: T[];
  skippedRows: Array<{ index: number; reason: string }>;
}> => {
  return new Promise((resolve, reject) => {
    const skippedRows: Array<{ index: number; reason: string }> = [];
    const validData: T[] = [];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Validate headers
        const headers = results.meta.fields || [];
        const missingHeaders = options.requiredHeaders.filter(
          (header) => !headers.includes(header),
        );

        if (missingHeaders.length > 0) {
          const error = new Error(
            `Missing required headers: ${missingHeaders.join(', ')}`,
          );
          options.onError?.(error);
          reject(error);
          return;
        }

        // Process rows
        results.data.forEach((row, index) => {
          try {
            const validatedRow = options.validateRow(
              row as Record<string, unknown>,
            );
            validData.push(validatedRow);
          } catch (error) {
            skippedRows.push({
              index,
              reason: error instanceof Error ? error.message : String(error),
            });
          }
        });

        const result = { data: validData, skippedRows };
        options.onComplete?.(result);
        resolve(result);
      },
      error: (error) => {
        logError({
          message: 'CSV parsing error',
          component: 'CsvParser',
          severity: 'medium',
          error: new Error(error.message),
          context: { fileName: file.name },
        });
        options.onError?.(new Error(error.message));
        reject(error);
      },
    });
  });
};

// Common CSV validation schemas
export const csvNumberSchema = z.string().transform((val, ctx) => {
  const parsed = Number(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid number format',
    });
    return z.NEVER;
  }
  return parsed;
});

export const csvDateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format');

export const csvBooleanSchema = z.string().transform((val, ctx) => {
  const normalized = val.toLowerCase().trim();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: 'Invalid boolean format',
  });
  return z.NEVER;
});
