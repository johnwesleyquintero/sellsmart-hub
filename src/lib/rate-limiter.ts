import { Redis } from 'ioredis';
import { headers } from 'next/headers';
import { logger } from './logger';

export class RateLimiter {
  constructor(private redis: Redis) {}

  private async getClientIp(): Promise<string> {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    return forwardedFor?.split(',')[0] || 'unknown';
  }

  async limit(): Promise<{ success: boolean }> {
    const ip = await this.getClientIp();
    const key = `rate-limit:${ip}`;
    const now = Date.now();
    const windowMs = 60000; // Example time window in milliseconds
    const maxRequests = 10; // Example max requests

    const windowStart = now - windowMs;

    try {
      // Get all requests in the current window
      const requests = await this.redis.zrangebyscore(key, windowStart, now);

      // Remove expired entries
      await this.redis.zremrangebyscore(key, 0, windowStart);

      if (!requests || requests.length < maxRequests) {
        // Add current request with timestamp
        await this.redis.zadd(key, now, now.toString());
        // Set key expiration
        await this.redis.expire(key, Math.ceil(windowMs / 1000));
        return { success: true };
      }

      logger.warn('Rate limit exceeded:', {
        ip,
        requests: requests.length,
        limit: maxRequests,
        windowMs,
      });

      return { success: false };
    } catch (error) {
      // If Redis fails, default to allowing the request
      logger.error('Rate limiter error:', { error });
      return { success: true };
    }
  }
}

export const rateLimiter = new RateLimiter(new Redis());
