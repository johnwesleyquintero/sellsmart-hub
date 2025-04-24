import type { NextResponse } from 'next/server';
import { ZodError } from 'zod';

type ErrorResponse = {
  statusCode: number;
  message: string;
  details?: string;
};

export const determineErrorType = (error: unknown): ErrorResponse => {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Validation error',
      details: error.errors.map((e) => e.message).join(', '),
    };
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return { statusCode: 504, message: 'Request timed out' };
    }

    if (error.message.includes('GEMINI_API_KEY')) {
      return { statusCode: 503, message: 'Service configuration error' };
    }

    if (error.message.toLowerCase().includes('rate limit')) {
      return { statusCode: 429, message: 'Too many requests' };
    }
  }

  return { statusCode: 500, message: 'Internal server error' };
};

export const logErrorDetails = (
  error: unknown,
  context: Record<string, unknown>,
) => {
  console.error({
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : 'Unknown error',
    ...context,
  });
};

export const formatErrorResponse = (error: ErrorResponse): NextResponse => {
  return new NextResponse(
    JSON.stringify({
      error: error.message,
      details: error.details,
    }),
    {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
