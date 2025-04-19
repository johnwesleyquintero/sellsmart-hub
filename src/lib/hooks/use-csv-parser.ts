'use client';

import Papa, { ParseResult } from 'papaparse';
import { useCallback, useState } from 'react';

interface CsvParserOptions<T> {
  requiredHeaders: string[];
  validateRow: (row: Record<string, unknown>, index: number) => T;
}

interface CsvParserResult<T> {
  data: T[];
  skippedRows: Array<{ index: number; reason: string }>;
}

interface UseCsvParserResult<T> {
  parseFile: (file: File) => Promise<CsvParserResult<T>>;
  isLoading: boolean;
  error: string | null;
}

// Helper function to process the parsed results
function processParsedData<T>(
  result: ParseResult<Record<string, unknown>>, // Explicitly type the row data
  options: CsvParserOptions<T>,
): CsvParserResult<T> {
  // Validate required headers
  const actualHeaders = result.meta.fields || [];
  const missingHeaders = options.requiredHeaders.filter(
    (header) => !actualHeaders.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  // Process rows with validation
  const validRows: T[] = [];
  const skippedRows: Array<{ index: number; reason: string }> = [];

  // Explicitly type row as Record<string, unknown> which is correct for header: true
  result.data.forEach((row: Record<string, unknown>, index: number) => {
    try {
      // Ensure row is actually an object before validation, skip if not (e.g., empty lines parsed weirdly)
      if (typeof row === 'object' && row !== null) {
        const validatedRow = options.validateRow(row, index);
        validRows.push(validatedRow);
      } else {
         // Optionally skip or log rows that aren't objects if needed
         // skippedRows.push({ index, reason: 'Row is not a valid object' });
      }
    } catch (err) {
      skippedRows.push({
        index,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  });

  if (validRows.length === 0 && result.data.length > 0) {
    throw new Error(
      'No valid data found after processing. Please check the CSV format.',
    );
  }

  return {
    data: validRows,
    skippedRows,
  };
}

export function useCsvParser<T>(
  options: CsvParserOptions<T>,
): UseCsvParserResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    (file: File) => {
      // Return the promise directly
      return new Promise<CsvParserResult<T>>((resolve, reject) => {
        setIsLoading(true);
        setError(null);

        Papa.parse<Record<string, unknown>>(file, { // Specify row type for Papa.parse
          header: true,
          dynamicTyping: false, // Keep manual type conversion/validation
          skipEmptyLines: 'greedy',
          transform: (value) => value.trim(), // transform runs on each cell value
          complete: (result) => {
            setIsLoading(false);
            try {
              if (result.errors.length > 0) {
                 // Handle PapaParse specific errors first
                 throw new Error(`Error parsing CSV file: ${result.errors[0].message}`);
              }
              // Use the helper function to process data and handle validation errors
              const processedResult = processParsedData(result, options);
              resolve(processedResult);
            } catch (err) {
              // Catch errors from processParsedData (missing headers, no valid rows)
              const errorMessage = err instanceof Error ? err.message : String(err);
              setError(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          error: (err: Error) => { // Use err instead of error to avoid shadowing state variable
            setIsLoading(false);
            const errorMessage = `Error parsing CSV file: ${err.message}`;
            setError(errorMessage);
            reject(new Error(errorMessage)); // Reject with the actual error object
          },
        });
      });
    },
    [options], // options is the dependency
  );

  return {
    parseFile,
    isLoading,
    error,
  };
}
