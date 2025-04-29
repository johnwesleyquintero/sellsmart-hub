import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';

export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export function validateRequest<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

export function apiResponse<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<{ data: T; error: null }> {
  return NextResponse.json(
    { data, error: null },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        ...init?.headers,
      },
      ...init,
    },
  );
}

export function apiError(
  error: Error | string,
  status: number = 500,
): NextResponse<{ data: null; error: { message: string; details?: unknown } }> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorDetails =
    error instanceof ValidationError ? error.errors.flatten() : undefined;

  logger.error('API Error:', { error, status });

  return NextResponse.json(
    {
      data: null,
      error: {
        message: errorMessage,
        ...(errorDetails && { details: errorDetails }),
      },
    },
    { status },
  );
}

export async function validateApiRoute<T>(
  request: NextRequest,
  schema: z.Schema<T>,
  handler: (validatedData: T) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    let data: unknown;

    if (request.method === 'GET') {
      const url = new URL(request.url);
      data = Object.fromEntries(url.searchParams.entries());
    } else {
      data = await request.json().catch(() => ({}));
    }

    const validatedData = validateRequest(schema, data);
    return await handler(validatedData);
  } catch (error) {
    if (error instanceof ValidationError) {
      return apiError(error, 400);
    }

    return apiError(
      error instanceof Error ? error : new Error('Unknown error'),
      500,
    );
  }
}
