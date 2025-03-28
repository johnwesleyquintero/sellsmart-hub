export interface AnalysisResult<T> {
  data: T;
  status: "success" | "warning" | "error";
  message?: string;
  timestamp: Date;
}

export interface CSVParseResult<T> {
  validRows: T[];
  invalidRows: any[];
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export interface BaseToolConfig {
  validateData?: boolean;
  generateReport?: boolean;
  exportFormat?: "csv" | "json" | "pdf";
}

export type AnalysisMetrics = {
  processedCount: number;
  errorCount: number;
  warningCount: number;
  processingTimeMs: number;
};

export interface ErrorWithContext extends Error {
  context?: {
    toolName: string;
    operation: string;
    inputData?: unknown;
  };
}

export interface DataValidationRule<T> {
  validate: (data: T) => boolean;
  message: string;
  severity: "error" | "warning";
}

export interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  memoryUsage: number;
  batchSize?: number;
  processingTime: number;
}

export interface AnalyticsResult {
  trends: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
  summary: {
    total: number;
    average: number;
    median: number;
    min: number;
    max: number;
  };
  segments: Record<string, number>;
}
