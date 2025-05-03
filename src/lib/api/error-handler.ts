import { logger } from './logger';

export class ApiError extends Error {
  statusCode: number;
  details: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any, req: any, res: any) => {
  logger.error(`API Error: ${error.message}`, {
    url: req?.url,
    method: req?.method,
    error: error,
  });

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  // Generic error
  return res
    .status(500)
    .json({ status: 500, message: 'Internal Server Error', details: null });
};
