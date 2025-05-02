import { act, renderHook } from '@testing-library/react';
import { useCsvParser } from '../use-csv-parser';

// Mock browser APIs
const mockFile = (
  fileBits: BlobPart[],
  fileName: string,
  options?: FilePropertyBag,
): File => {
  return new File(fileBits, fileName, options);
};


const mockBlob = (blobParts: BlobPart[], options?: BlobPropertyBag): Blob => {
  const buffer = new TextEncoder().encode(blobParts.join(''));
  return new Blob([buffer], options);
};
beforeAll(() => {
  // Mock File and Blob constructors
  // Assign mock implementations
  (global as any).File = mockFile;
  (global as any).Blob = mockBlob;
});

describe.skip('useCsvParser', () => {
  const mockOptions = {
    requiredHeaders: ['name', 'value'],
    validateRow: (row: Record<string, unknown>, index: number) => {
      return row;
    },
  };

  const createMockFile = (content: string): File => {
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], 'test.csv', { type: 'text/csv' });
  };

  it('should parse valid CSV data correctly', async () => {
    const csvContent = 'name,value\nTest1,1\nTest2,2';
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
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('No valid data found after processing');
      }
    });

    expect(result.current.error).not.toBeNull();
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

    let error: Error | undefined;
    await act(async () => {
      try {
        await result.current.parseFile(file);
      } catch (e: any) {
        error = e;
      }
    });

    expect(mockOnError).toHaveBeenCalled();
    expect(error?.message).toContain('Missing required columns: name');
  });

  it('should call onComplete callback when provided', async () => {
    const mockOnComplete = jest.fn();
    const csvContent = 'name,value\nTest1,1\nTest2,2';
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
