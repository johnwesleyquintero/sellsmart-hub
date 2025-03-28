import { securityHeaders } from "@/lib/config/security";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const rateLimit = new Map();
const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (typeof value === "string") {
      response.headers.set(key.replace(/([A-Z])/g, "-$1").toLowerCase(), value);
    }
  });

  // Apply CORS headers
  response.headers.set(
    "Access-Control-Allow-Origin",
    "https://wesleyquintero.vercel.app",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || '';
    const current = rateLimit.get(ip) || { count: 0, lastReset: Date.now() };
    
    if (Date.now() - current.lastReset > WINDOW_MS) {
      current.count = 0;
      current.lastReset = Date.now();
    }
    
    if (current.count >= RATE_LIMIT) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
    
    current.count++;
    rateLimit.set(ip, current);
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
