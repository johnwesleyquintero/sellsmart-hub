import Papa from 'papaparse';
import { z } from 'zod';
import { 
  reportSchema,
  campaignReportSchema,
  inventoryReportSchema,
  businessReportSchema,
  searchQueryReportSchema,
  listingReportSchema,
  customReportSchema
} from '../types/amazon';

export class FileProcessor {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size

  /**
   * Validates file size and type
   */
  static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Only CSV files are supported');
    }
  }

  /**
   * Detects report type based on headers and data patterns
   */
  static detectReportType(headers: string[], firstRow: any): string {
    const headerSet = new Set(headers.map(h => h.toLowerCase()));

    if (headerSet.has('campaign id') && headerSet.has('impressions')) {
      return 'CAMPAIGN';
    }
    if (headerSet.has('sku') && headerSet.has('quantity')) {
      return 'INVENTORY';
    }
    if (headerSet.has('ordered revenue') && headerSet.has('ordered units')) {
      return 'BUSINESS';
    }
    if (headerSet.has('customer search term') && headerSet.has('clicks')) {
      return 'SEARCH_QUERY';
    }
    if (headerSet.has('asin') && headerSet.has('listing status')) {
      return 'LISTING';
    }
    
    return 'CUSTOM';
  }

  /**
   * Processes CSV file and returns structured data
   */
  static async processFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.validateFile(file);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunk: (results, parser) => {
          try {
            // Process the chunk
            const processedChunk = this.processChunk(results.data);
            // You can emit progress here if needed
          } catch (error) {
            parser.abort();
            reject(error);
          }
        },
        complete: (results) => {
          try {
            const reportType = this.detectReportType(results.meta.fields || [], results.data[0]);
            const processedData = this.validateAndTransformData(results.data, reportType);
            resolve({
              reportType,
              uploadDate: new Date().toISOString(),
              fileName: file.name,
              processingStatus: 'COMPLETED',
              data: processedData,
              ...(reportType === 'CUSTOM' && { headers: results.meta.fields }),
            });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Processes a chunk of data
   */
  private static processChunk(chunk: any[]): any[] {
    return chunk.map(row => {
      // Convert numeric strings to numbers
      Object.keys(row).forEach(key => {
        const value = row[key];
        if (typeof value === 'string' && !isNaN(Number(value))) {
          row[key] = Number(value);
        }
      });
      return row;
    });
  }

  /**
   * Validates and transforms data based on report type
   */
  private static validateAndTransformData(data: any[], reportType: string): any[] {
    let schema;
    switch (reportType) {
      case 'CAMPAIGN':
        schema = campaignReportSchema;
        break;
      case 'INVENTORY':
        schema = inventoryReportSchema;
        break;
      case 'BUSINESS':
        schema = businessReportSchema;
        break;
      case 'SEARCH_QUERY':
        schema = searchQueryReportSchema;
        break;
      case 'LISTING':
        schema = listingReportSchema;
        break;
      default:
        schema = customReportSchema;
    }

    try {
      return schema.parse(data).data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Data validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Exports data to CSV format
   */
  static exportToCSV(data: any[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}