import { securityHeaders } from "@/lib/config/security";
import { RateLimiter } from "@/lib/rate-limiter";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const limiter = new RateLimiter({
  maxTokens: 100,
  refillRate: 10,
  refillInterval: 60 * 1000, // 1 minute
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (typeof value === 'string') {
      response.headers.set(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
    }
  });

  // Apply CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'https://wesleyquintero.vercel.app');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    try {
      await limiter.acquire();
    } catch {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
