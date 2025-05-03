import { rateLimiter } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function HEAD() {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter.limit();
  if (!rateLimitResult.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function GET() {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter.limit();
  if (!rateLimitResult.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  return Response.json({ status: 'ok' });
}

export async function POST() {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter.limit();
  if (!rateLimitResult.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  return Response.json({ status: 'ok' });
}
