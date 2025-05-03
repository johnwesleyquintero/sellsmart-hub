export const dynamic = 'force-static';
import { rateLimiter } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

export async function GET() {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter.limit();
  if (!rateLimitResult.success) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }
  return new Response(JSON.stringify({ message: 'Resume endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}
