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

export const handleApiError = (
  error: unknown,
  req: { url?: string; method?: string },
) => {
  logger.error(`API Error: ${(error as Error).message}`, {
    url: req?.url,
    method: req?.method,
    error: error,
  });

  if (error instanceof ApiError) {
    // Since we don't have access to the response object here, we can't send a JSON response.
    // We'll just re-throw the error.
    throw error;
  }

  // Generic error
  // Since we don't have access to the response object here, we can't send a JSON response.
  // We'll just re-throw the error.
  throw new ApiError(500, 'Internal Server Error', null);
};
