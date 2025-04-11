export class InventoryOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryOptimizationError';
  }
}

export class AmazonAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmazonAPIError';
  }
}

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataValidationError';
  }
}
