import { logger } from '@/lib/logger';
import { get } from '@vercel/edge-config';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Security headers configuration with nonce for enhanced security
const generateSecurityHeaders = (nonce?: string) => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} 'unsafe-eval'`,
    `style-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https:`,
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com https://api.linkedin.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
});

// List of public paths that don't require authentication
const publicPaths = [
  '/api/amazon',
  '/amazon-seller-tools',
  '/blog',
  '/',
  '/images',
  '/api/content',
];

export async function middleware(request: NextRequest) {
  try {
    // Generate nonce for CSP
    const nonce = Buffer.from(uuidv4()).toString('base64');

    // Check maintenance mode first
    const maintenanceMode = await get('maintenance_mode');
    if (maintenanceMode) {
      const response = NextResponse.redirect(
        new URL('/maintenance', request.url),
      );
      const headers = generateSecurityHeaders(nonce);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const path = request.nextUrl.pathname;
    const isPublicPath = publicPaths.some(
      (publicPath) => path.startsWith(publicPath) || path === publicPath,
    );

    // Get authentication token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Create response
    let response: NextResponse;

    if (!isPublicPath && !token) {
      const redirectUrl = new URL('/api/auth/signin', request.url);
      redirectUrl.searchParams.set('callbackUrl', encodeURI(request.url));
      response = NextResponse.redirect(redirectUrl);
    } else {
      response = NextResponse.next();
    }

    // Apply security headers with nonce
    const headers = generateSecurityHeaders(nonce);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Set nonce in header for use in components
    response.headers.set('x-nonce', nonce);

    // Add request ID for tracking
    const requestId = uuidv4();
    response.headers.set('X-Request-ID', requestId);

    return response;
  } catch (error) {
    logger.error('Middleware error:', {
      error,
      path: request.nextUrl.pathname,
    });

    // Return 500 error with security headers
    const errorResponse = NextResponse.error();
    const headers = generateSecurityHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });
    return errorResponse;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/user/:path*',
    '/api/protected/:path*',
    '/((?!_next/static|favicon.ico|robots.txt).*)',
  ],
};
