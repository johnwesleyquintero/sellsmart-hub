import { act, renderHook } from '@testing-library/react';
import { useCsvParser } from '../use-csv-parser';

describe('useCsvParser', () => {
  const mockOptions = {
    requiredHeaders: ['name', 'value'],
    validateRow: (row: Record<string, unknown>) => ({
      name: String(row.name),
      value: Number(row.value),
    }),
  };

  const createMockFile = (content: string): File => {
    return new File([content], 'test.csv', { type: 'text/csv' });
  };

  it('should parse valid CSV data correctly', async () => {
    const csvContent = 'name,value\nTest,123';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() => useCsvParser(mockOptions));

    await act(async () => {
      await result.current.parseFile(file);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle missing required headers', async () => {
    const csvContent = 'wrongHeader,value\nTest,123';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() => useCsvParser(mockOptions));

    await act(async () => {
      try {
        await result.current.parseFile(file);
      } catch (error: any) {
        expect(error.message).toContain('Missing required columns: name');
      }
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle invalid row data', async () => {
    const csvContent = 'name,value\nTest,invalid';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() => useCsvParser(mockOptions));

    await act(async () => {
      try {
        await result.current.parseFile(file);
      } catch (error: any) {
        expect(error.message).toContain('No valid data found after processing');
      }
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle empty CSV file', async () => {
    const csvContent = '';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() => useCsvParser(mockOptions));

    await act(async () => {
      try {
        await result.current.parseFile(file);
      } catch (error: any) {
        expect(error.message).toContain('Error parsing CSV file');
      }
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle file size limit', async () => {
    // Create a large string that exceeds 10MB
    const largeContent = 'a'.repeat(11 * 1024 * 1024);
    const file = createMockFile(largeContent);

    const { result } = renderHook(() => useCsvParser(mockOptions));

    await act(async () => {
      try {
        await result.current.parseFile(file);
      } catch (error: any) {
        expect(error.message).toBe('File size exceeds 10MB limit');
      }
    });

    expect(result.current.error).toBe('File size exceeds 10MB limit');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle percentage values correctly', async () => {
    const csvContent = 'name,value\nTest,50%';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() => useCsvParser(mockOptions));

    let parseResult;
    await act(async () => {
      parseResult = await result.current.parseFile(file);
    });

    expect(parseResult).toEqual({
      data: [{ name: 'Test', value: 0.5 }],
      skippedRows: [],
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should call onError callback when provided', async () => {
    const mockOnError = jest.fn();
    const csvContent = 'wrongHeader,value\nTest,123';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() => useCsvParser(mockOptions, mockOnError));

    await act(async () => {
      await result.current.parseFile(file);
    });

    expect(mockOnError).toHaveBeenCalled();
    const error = mockOnError.mock.calls[0][0];
    expect(error.message).toContain('Missing required columns: name');
  });

  it('should call onComplete callback when provided', async () => {
    const mockOnComplete = jest.fn();
    const csvContent = 'name,value\nTest,123';
    const file = createMockFile(csvContent);

    const { result } = renderHook(() =>
      useCsvParser(mockOptions, undefined, mockOnComplete),
    );

    await act(async () => {
      await result.current.parseFile(file);
    });

    expect(mockOnComplete).toHaveBeenCalledWith({
      data: [{ name: 'Test', value: 123 }],
      skippedRows: [],
    });
  });
});
