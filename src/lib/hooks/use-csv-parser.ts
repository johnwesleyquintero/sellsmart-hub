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
  result: ParseResult<Record<string, unknown>>,
  options: CsvParserOptions<T>,
): CsvParserResult<T> {
  console.log('processParsedData: Starting processing');
  console.log('processParsedData: result.data.length', result.data.length);

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

  // Use for loop instead of forEach to avoid potential recursion
  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    try {
      if (typeof row === 'object' && row !== null) {
        const validatedRow = options.validateRow(row, i);
        validRows.push(validatedRow);
      } else {
        skippedRows.push({ index: i, reason: 'Row is not a valid object' });
      }
    } catch (err) {
      skippedRows.push({
        index: i,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (validRows.length === 0 && result.data.length > 0) {
    throw new Error(
      'No valid data found after processing. Please check the CSV format.',
    );
  }

  console.log('processParsedData: Finishing processing');
  return {
    data: validRows,
    skippedRows,
  };
}

export function useCsvParser<T>(
  options: CsvParserOptions<T>,
  onError?: (error: Error) => void,
  onComplete?: (result: CsvParserResult<T>) => void,
): UseCsvParserResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    (file: File) => {
      console.log('parseFile: Starting parsing of file', file.name);
      return new Promise<CsvParserResult<T>>((resolve, reject) => {
        setIsLoading(true);
        setError(null);

        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          const error = new Error('File size exceeds 10MB limit');
          setError(error.message);
          onError?.(error);
          reject(error);
          setIsLoading(false); // Ensure isLoading is set to false on rejection
          return;
        }

        setIsLoading(true);
        setError(null);

        console.log('parseFile: Before Papa.parse');
        Papa.parse<Record<string, unknown>>(file, {
          header: true,
          //dynamicTyping: true, // Enable automatic type conversion
          skipEmptyLines: 'greedy',
          transform: (value) => {
            if (typeof value === 'string') {
              value = value.trim();
              // Convert percentage values to numbers
              if (value.endsWith('%')) {
                return parseFloat(value) / 100;
              }
            }
            return value;
          },
          transformHeader: (header) => header.trim(),
          complete: (result) => {
            console.log('parseFile: Papa.parse complete callback');
            setIsLoading(false);
            try {
              if (result.errors.length > 0) {
                throw new Error(
                  `Error parsing CSV file: ${result.errors[0].message}`,
                );
              }
              const processedResult = processParsedData(result, options);
              onComplete?.(processedResult);
              resolve(processedResult);
            } catch (err) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              setError(errorMessage);
              onError?.(new Error(errorMessage));
              reject(new Error(errorMessage));
            }
          },
          error: (err: Error) => {
            setIsLoading(false);
            const errorMessage = `Error parsing CSV file: ${err.message}`;
            setError(errorMessage);
            onError?.(new Error(errorMessage));
            reject(new Error(errorMessage));
          },
        });
        console.log('parseFile: After Papa.parse');
      });
    },
    [options, onError, onComplete],
  );

  return {
    parseFile,
    isLoading,
    error,
  };
}
