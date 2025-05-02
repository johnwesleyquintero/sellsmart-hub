export class InventoryOptimizationError extends Error {
  errorCode: string;
  details: unknown;

  constructor(message: string, errorCode: string, details?: unknown) {
    super(message);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'InventoryOptimizationError';
  }
}

export class MissingDataError extends InventoryOptimizationError {
  constructor(message: string, details?: unknown) {
    super(message, 'missing_data', details);
    this.name = 'MissingDataError';
  }
}

export class InvalidDataError extends InventoryOptimizationError {
  constructor(message: string, details?: unknown) {
    super(message, 'invalid_data', details);
    this.name = 'InvalidDataError';
  }
}
