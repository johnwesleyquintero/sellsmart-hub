import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';

type RedisConfig = {
  url: string;
  token: string;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | null;
};

// Validate environment variables
function getRedisConfig(): RedisConfig {
  const url = process.env.KV_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing required Redis environment variables (KV_URL and KV_REST_API_TOKEN)',
    );
  }

  return {
    url,
    token,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 5000),
  };
}

// Initialize Redis client with connection pooling
export const redis = new UpstashRedis(getRedisConfig());

// Configure rate limiting
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '60s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Helper function to check Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis connection error:', error);
    return false;
  }
}
