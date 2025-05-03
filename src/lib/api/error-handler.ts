import { logger } from './logger';

export class ApiError extends Error {
  statusCode: number;
  details: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: unknown, req: unknown, res: unknown) => {
  logger.error(`API Error: ${(error as Error).message}`, {
    url: (req as any)?.url,
    method: (req as any)?.method,
    error: error,
  });

  if (error instanceof ApiError) {
    return (res as any).status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  // Generic error
  return (res as any)
    .status(500)
    .json({ status: 500, message: 'Internal Server Error', details: null });
};
