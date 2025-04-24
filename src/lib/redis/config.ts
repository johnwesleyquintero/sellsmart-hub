import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.KV_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Configure rate limiting
export const rateLimiter = new Ratelimit({
  redis: redis as any, // Temporarily using 'any' to bypass type mismatch
  limiter: Ratelimit.slidingWindow(5, '60s'), // 5 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Helper function to check Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping(); // Ensure 'ping' method is available or replace with a valid method
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}
