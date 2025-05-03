import { logger } from './logger';

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
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
      data: error.data,
    });
  }

  // Generic error
  return res.status(500).json({ message: 'Internal Server Error' });
};
