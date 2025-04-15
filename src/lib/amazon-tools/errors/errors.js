export class InventoryOptimizationError extends Error {
  constructor(message, errorCode, details) {
    super(message);
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'InventoryOptimizationError';
  }
}
