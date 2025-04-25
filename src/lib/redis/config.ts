import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';

// Initialize Redis client
export const redisConfig = {
  url: process.env.KV_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
};

export const redis: Redis = new Redis(redisConfig);

// Configure rate limiting

export const rateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '60s'), // 5 requests per minute
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Helper function to check Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping(); // Ensure 'ping' method is available or replace with a valid method
    await redis.ping(); // Replace with a valid method if 'ping' is not available
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}
