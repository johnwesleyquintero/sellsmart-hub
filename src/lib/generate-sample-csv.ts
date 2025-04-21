import Papa from 'papaparse';
import { logger } from './logger';

// Define supported data types and their generators
type DataType = 'string' | 'number' | 'date' | 'boolean' | 'enum';

interface DataTypeConfig {
  type: DataType;
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    values?: string[];
    format?: string;
    prefix?: string;
    suffix?: string;
  };
}

interface ColumnConfig {
  name: string;
  dataType: DataTypeConfig;
  required?: boolean;
  description?: string;
}

interface SampleDataConfig {
  columns: ColumnConfig[];
  rowCount?: number;
  customGenerators?: Record<string, (config: DataTypeConfig) => any>;
}

// Data generation functions
const dataGenerators = {
  string: (config: DataTypeConfig['options'] = {}) => {
    const { prefix = '', suffix = '' } = config;
    // Security: Acceptable for sample data generation
    const length = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    const randomStr = Array.from(
      randomValues,
      (val) => chars[val % chars.length],
    ).join('');
    return `${prefix}${randomStr}${suffix}`;
  },

  number: (config: DataTypeConfig['options'] = {}) => {
    const { min = 0, max = 100, decimals = 0 } = config;
    // Security: Safe for demo data generation
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const num = (randomBuffer[0] / 4294967295) * (max - min) + min;
    return Number(num.toFixed(decimals));
  },

  date: (config: DataTypeConfig['options'] = {}) => {
    const { format = 'ISO' } = config;
    // Security: Appropriate for non-cryptographic use
    const randomBuffer = new Uint32Array(1);
    window.crypto.getRandomValues(randomBuffer);
    const date = new Date(
      Date.now() - (randomBuffer[0] / 4294967295) * 365 * 24 * 60 * 60 * 1000,
    );
    return format === 'ISO' ? date.toISOString() : date.toLocaleDateString();
  },

  boolean: () => Math.random() > 0.5, // Security: Acceptable for sample data

  enum: (config: DataTypeConfig['options'] = {}) => {
    const { values = ['Option1', 'Option2', 'Option3'] } = config;
    // Security: Safe for demo data randomization
    return values[Math.floor(Math.random() * values.length)];
  },
};

/**
 * Generates sample data based on the provided configuration
 */
const generateSampleData = (
  config: SampleDataConfig,
): Record<string, any>[] => {
  const { columns, rowCount = 5, customGenerators = {} } = config;

  try {
    return Array.from({ length: rowCount }, () => {
      const row: Record<string, any> = {};

      columns.forEach(({ name, dataType, required = true }) => {
        if (!required && Math.random() > 0.8) {
          return; // 20% chance to skip non-required fields
        }

        const generator =
          customGenerators[dataType.type] || dataGenerators[dataType.type];
        if (!generator) {
          throw new Error(`Unsupported data type: ${dataType.type}`);
        }

        row[name] = generator(dataType.options as any);
      });

      return row;
    });
  } catch (error) {
    logger.error('Error generating sample data', { error, config });
    throw new Error(
      `Failed to generate sample data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

// Predefined sample data configurations
const sampleDataConfigs: Record<string, SampleDataConfig> = {
  fba: {
    columns: [
      {
        name: 'productName',
        dataType: { type: 'string', options: { prefix: 'Product-' } },
        required: true,
        description: 'Product name or identifier',
      },
      {
        name: 'cost',
        dataType: { type: 'number', options: { min: 5, max: 50, decimals: 2 } },
        required: true,
        description: 'Product cost',
      },
      {
        name: 'price',
        dataType: {
          type: 'number',
          options: { min: 15, max: 100, decimals: 2 },
        },
        required: true,
        description: 'Selling price',
      },
      {
        name: 'fees',
        dataType: { type: 'number', options: { min: 2, max: 15, decimals: 2 } },
        required: true,
        description: 'FBA fees',
      },
    ],
    rowCount: 5,
  },

  keyword: {
    columns: [
      {
        name: 'productName',
        dataType: { type: 'string', options: { prefix: 'Product-' } },
        required: true,
      },
      {
        name: 'keywords',
        dataType: { type: 'string' },
        required: true,
      },
      {
        name: 'searchVolume',
        dataType: { type: 'number', options: { min: 1000, max: 500000 } },
        required: true,
      },
      {
        name: 'competition',
        dataType: {
          type: 'enum',
          options: { values: ['Low', 'Medium', 'High'] },
        },
        required: true,
      },
    ],
    rowCount: 3,
  },

  ppc: {
    columns: [
      {
        name: 'name',
        dataType: { type: 'string', options: { prefix: 'Campaign-' } },
        required: true,
      },
      {
        name: 'type',
        dataType: {
          type: 'enum',
          options: {
            values: ['Auto', 'Sponsored Products', 'Sponsored Brands'],
          },
        },
        required: true,
      },
      {
        name: 'spend',
        dataType: {
          type: 'number',
          options: { min: 50, max: 500, decimals: 2 },
        },
        required: true,
      },
      {
        name: 'sales',
        dataType: {
          type: 'number',
          options: { min: 100, max: 2000, decimals: 2 },
        },
        required: true,
      },
      {
        name: 'impressions',
        dataType: { type: 'number', options: { min: 1000, max: 20000 } },
        required: true,
      },
      {
        name: 'clicks',
        dataType: { type: 'number', options: { min: 50, max: 500 } },
        required: true,
      },
    ],
    rowCount: 3,
  },
};

/**
 * Generates sample CSV data for the specified data type
 */
const DEFAULT_PRODUCT_NAME = 'Generic Product';
export function generateSampleCsv(
  dataType: keyof typeof sampleDataConfigs,
): string {
  const config = sampleDataConfigs[dataType];
  if (!config) {
    throw new Error(`Unsupported data type: ${dataType}`);
  }

  try {
    const data = generateSampleData(config);
    if (data.length === 0) return '';
    return Papa.unparse(data);
  } catch (error) {
    logger.error('Error generating sample CSV', { error, dataType });
    throw new Error(
      `Failed to generate sample CSV: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
export function downloadSampleCsv(
  dataType: keyof typeof sampleDataConfigs,
  fileName?: string,
): void {
  try {
    console.log(`[CSV Download] Starting download for type: ${dataType}`);

    const csv = generateSampleCsv(dataType);
    if (!csv) {
      console.error(
        '[CSV Download] Generated CSV string is empty, aborting download.',
      );
      return;
    }
    console.log(
      `[CSV Download] Successfully generated CSV with ${csv.split('\n').length} rows`,
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    console.log('[CSV Download] Created Blob URL for download');

    const link = document.createElement('a');
    const downloadName = fileName || `sample-${dataType}-data.csv`;
    link.href = url;
    link.setAttribute('download', downloadName);
    console.log(
      `[CSV Download] Initiating download with filename: ${downloadName}`,
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object to prevent memory leaks
    URL.revokeObjectURL(url);
    console.log('[CSV Download] Completed download and cleaned up resources');
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[CSV Download] Error during download:', error.message);
      throw new Error(`Failed to download CSV: ${error.message}`);
    } else {
      console.error(
        '[CSV Download] An unknown error occurred during download:',
        error,
      );
      throw new Error(`Failed to download CSV: An unknown error occurred.`);
    }
  }
}
