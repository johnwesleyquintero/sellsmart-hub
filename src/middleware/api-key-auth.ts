import { validateApiKey } from '@/lib/api-key-management';
import { rateLimiter } from '@/lib/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

export async function apiKeyAuth(
  req: NextRequest,
): Promise<NextResponse | null> {
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return new NextResponse(JSON.stringify({ error: 'API key is missing' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValid = await validateApiKey(apiKey);

  if (!isValid) {
    return new NextResponse(JSON.stringify({ error: 'API key is invalid' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rateLimitResult = await rateLimiter.limit();

  if (!rateLimitResult.success) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null; // API key is valid, continue to the next middleware or route handler
}
