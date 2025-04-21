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
    const length = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const randomStr = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${prefix}${randomStr}${suffix}`;
  },

  number: (config: DataTypeConfig['options'] = {}) => {
    const { min = 0, max = 100, decimals = 0 } = config;
    const num = Math.random() * (max - min) + min;
    return Number(num.toFixed(decimals));
  },

  date: (config: DataTypeConfig['options'] = {}) => {
    const { format = 'ISO' } = config;
    const date = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    return format === 'ISO' ? date.toISOString() : date.toLocaleDateString();
  },

  boolean: () => Math.random() > 0.5,

  enum: (config: DataTypeConfig['options'] = {}) => {
    const { values = ['Option1', 'Option2', 'Option3'] } = config;
    return values[Math.floor(Math.random() * values.length)];
  },
};

/**
 * Generates sample data based on the provided configuration
 */
const generateSampleData = (config: SampleDataConfig): Record<string, any>[] => {
  const { columns, rowCount = 5, customGenerators = {} } = config;

  try {
    return Array.from({ length: rowCount }, () => {
      const row: Record<string, any> = {};
      
      columns.forEach(({ name, dataType, required = true }) => {
        if (!required && Math.random() > 0.8) {
          return; // 20% chance to skip non-required fields
        }

        const generator = customGenerators[dataType.type] || dataGenerators[dataType.type];
        if (!generator) {
          throw new Error(`Unsupported data type: ${dataType.type}`);
        }

        row[name] = generator(dataType.options);
      });

      return row;
    });
  } catch (error) {
    logger.error('Error generating sample data', { error, config });
    throw new Error(`Failed to generate sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        dataType: { type: 'number', options: { min: 15, max: 100, decimals: 2 } },
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
        dataType: { type: 'enum', options: { values: ['Low', 'Medium', 'High'] } },
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
          options: { values: ['Auto', 'Sponsored Products', 'Sponsored Brands'] },
        },
        required: true,
      },
      {
        name: 'spend',
        dataType: { type: 'number', options: { min: 50, max: 500, decimals: 2 } },
        required: true,
      },
      {
        name: 'sales',
        dataType: { type: 'number', options: { min: 100, max: 2000, decimals: 2 } },
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
export function generateSampleCsv(dataType: keyof typeof sampleDataConfigs): string {
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
    throw new Error(`Failed to generate sample CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const sampleData = [
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Vitamin C Face Mask',
          adSpend: 89.9,
          sales: 320.45,
          impressions: 6210,
          clicks: 178,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Retinol Night Cream',
          adSpend: 167.8,
          sales: 845.25,
          impressions: 9325,
          clicks: 265,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - CBD Body Lotion',
          adSpend: 210.3,
          sales: 923.7,
          impressions: 11240,
          clicks: 332,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Display - Collagen Eye Cream',
          adSpend: 155.55,
          sales: 734.85,
          impressions: 9650,
          clicks: 287,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Retinol Serum',
          adSpend: 198.25,
          sales: 945.3,
          impressions: 11200,
          clicks: 315,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - CBD Body Lotion',
          adSpend: 210.3,
          sales: 923.7,
          impressions: 11240,
          clicks: 332,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Ceramide Moisturizer',
          adSpend: 145.9,
          sales: 680.45,
          impressions: 8450,
          clicks: 240,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - AHA/BHA Peel',
          adSpend: 122.75,
          sales: 590.2,
          impressions: 7650,
          clicks: 205,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Hyaluronic Acid Toner',
          adSpend: 88.4,
          sales: 420.75,
          impressions: 5820,
          clicks: 165,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - Vitamin C Mask',
          adSpend: 132.6,
          sales: 645.9,
          impressions: 8750,
          clicks: 220,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Niacinamide Serum',
          adSpend: 178.9,
          sales: 855.25,
          impressions: 9650,
          clicks: 290,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Rosehip Oil',
          adSpend: 95.45,
          sales: 465.8,
          impressions: 6420,
          clicks: 185,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - SPF 50 Sunscreen',
          adSpend: 165.2,
          sales: 785.4,
          impressions: 9250,
          clicks: 275,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Ceramide Moisturizer',
          adSpend: 98.75,
          sales: 423.6,
          impressions: 7325,
          clicks: 204,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Hair Growth Serum',
          adSpend: 143.2,
          sales: 687.3,
          impressions: 8845,
          clicks: 245,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Acne Treatment Kit',
          adSpend: 121.9,
          sales: 587.45,
          impressions: 7980,
          clicks: 225,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - LED Face Mask',
          adSpend: 298.45,
          sales: 1345.8,
          impressions: 15420,
          clicks: 415,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Microcurrent Device',
          adSpend: 187.6,
          sales: 845.9,
          impressions: 10235,
          clicks: 298,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Scalp Massager',
          adSpend: 76.85,
          sales: 345.75,
          impressions: 6540,
          clicks: 185,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Jade Roller Set',
          adSpend: 65.3,
          sales: 287.4,
          impressions: 5320,
          clicks: 158,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - Gua Sha Tool',
          adSpend: 88.9,
          sales: 398.25,
          impressions: 6985,
          clicks: 195,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Sunscreen Stick',
          adSpend: 112.45,
          sales: 523.8,
          impressions: 8450,
          clicks: 235,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Lip Plumper',
          adSpend: 95.75,
          sales: 432.9,
          impressions: 7210,
          clicks: 208,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Hair Dryer Brush',
          adSpend: 165.8,
          sales: 798.5,
          impressions: 9325,
          clicks: 275,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - Curling Iron',
          adSpend: 134.2,
          sales: 623.75,
          impressions: 8540,
          clicks: 245,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Body Scrub',
          adSpend: 78.45,
          sales: 354.6,
          impressions: 6215,
          clicks: 178,
        },
      ];
      break;
    default:
      return '';
  }

  try {
    const data = generateSampleData(config);
    if (data.length === 0) return '';
    return Papa.unparse(data);
  } catch (error) {
    logger.error('Error generating sample CSV', { error, dataType });
    throw new Error(`Failed to generate sample CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
