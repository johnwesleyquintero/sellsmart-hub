'use client';
import DragDropArea from '@/components/ui/DragDropArea';
import { Button } from '@/components/ui/button';
import { logError } from '@/lib/error-handling';
import { validateCsvContent } from '@/lib/input-validation';
import { FileText, Info } from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import SampleCsvButton from './sample-csv-button';

interface CsvUploaderProps<T extends Record<string, unknown>> {
  onUploadSuccess: (data: T[]) => void;
  onUploadError?: (error: string) => void;
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  validateRow?: (row: Record<string, unknown>) => T | null;
  requiredColumns?: string[];
}

export const CsvUploader = <T extends Record<string, unknown>>({
  onUploadSuccess,
  onUploadError,
  allowedFileTypes = ['.csv'],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  validateRow,
  requiredColumns = ['id', 'impressions', 'clicks'],
}: CsvUploaderProps<T>) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  const handleCsvParse = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        onUploadError?.('Please upload a CSV file');
        return;
      }

      if (file.size > maxFileSize) {
        onUploadError?.(
          `File size exceeds ${maxFileSize / 1024 / 1024}MB limit`,
        );
        return;
      }

      setIsLoading(true);
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const csvData = event.target?.result;
          if (typeof csvData !== 'string') {
            throw new Error('Invalid file content');
          }

          // Validate CSV content for security
          const contentValidation = validateCsvContent(csvData);
          if (!contentValidation.isValid) {
            throw new Error(contentValidation.error);
          }

          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              const headers = results.meta.fields || [];
              const missingColumns = requiredColumns.filter(
                (col) => !headers.includes(col),
              );

              if (missingColumns.length > 0) {
                onUploadError?.(
                  `Missing required columns: ${missingColumns.join(', ')}`,
                );
                setIsLoading(false);
                return;
              }

              const validRows: T[] = [];
              const errors: string[] = [];

              results.data.forEach(
                (row: Record<string, unknown>, index: number) => {
                  try {
                    if (validateRow) {
                      const validRow = validateRow(row);
                      if (validRow) {
                        validRows.push(validRow);
                      } else {
                        errors.push(`Row ${index + 1}: Invalid data format`);
                      }
                    } else {
                      validRows.push(row as T);
                    }
                  } catch (error) {
                    errors.push(
                      `Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`,
                    );
                  }
                },
              );

              if (errors.length > 0) {
                logError({
                  component: 'CsvUploader',
                  message: `CSV validation errors:\n${errors.join('\n')}`,
                  severity: 'warning',
                });
                onUploadError?.(`Validation errors:\n${errors.join('\n')}`);
              }

              if (validRows.length > 0) {
                onUploadSuccess(validRows);
                setHasData(true);
              } else {
                onUploadError?.('No valid data found in the CSV file');
              }
              setIsLoading(false);
            },
            error: (error: Error) => {
              logError({
                component: 'CsvUploader',
                message: error.message,
                error,
              });
              onUploadError?.(error.message);
              setIsLoading(false);
            },
          });
        } catch (error) {
          logError({
            component: 'CsvUploader',
            message:
              error instanceof Error
                ? error.message
                : 'Failed to process CSV file',
            error,
          });
          onUploadError?.(
            error instanceof Error
              ? error.message
              : 'Failed to process CSV file',
          );
          setIsLoading(false);
        }
      };

      reader.onerror = (error) => {
        logError({
          component: 'CsvUploader',
          message: 'Failed to read the file',
          error:
            error instanceof Error ? error : new Error('File reading failed'),
        });
        onUploadError?.('Failed to read the file');
        setIsLoading(false);
      };

      reader.readAsText(file);
    },
    [maxFileSize, onUploadError, onUploadSuccess, validateRow, requiredColumns],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleCsvParse(acceptedFiles[0]);
      }
    },
    [handleCsvParse],
  );

  const { getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxSize: maxFileSize,
    multiple: false,
  });

  const onClear = useCallback(() => {
    setHasData(false);
    // Reset the file input
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium">CSV Format Requirements:</p>
          <p>
            Required columns:{' '}
            {requiredColumns.map((col) => (
              <code key={col} className="mx-1">
                {col}
              </code>
            ))}
          </p>
        </div>
      </div>

      <DragDropArea isDragActive={isDragActive}>
        <FileText className="mb-2 h-8 w-8 text-primary/60" />
        <span className="text-sm font-medium">Click to upload CSV</span>
        <input {...getInputProps()} disabled={isLoading} />
        <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
        <SampleCsvButton
          dataType="ppc"
          fileName="sample-ppc-campaign.csv"
          className="mt-4"
        />
      </DragDropArea>
      {hasData && (
        <Button variant="outline" onClick={onClear}>
          Clear Data
        </Button>
      )}
    </div>
  );
};

export default CsvUploader;
