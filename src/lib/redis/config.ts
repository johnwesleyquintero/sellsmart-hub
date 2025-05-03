import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';

export const redisConfig = {
  url: process.env.REDIS_URL || process.env.KV_URL,
  token: process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN,
  readOnlyToken: process.env.KV_REST_API_READ_ONLY_TOKEN,
  apiUrl: process.env.KV_REST_API_URL,
};

export function getRedisUrl() {
  const url = redisConfig.url;
  if (!url) {
    throw new Error('Redis URL not configured');
  }
  return url;
}

export function getRedisToken() {
  const token = redisConfig.token;
  if (!token) {
    throw new Error('Redis token not configured');
  }
  return token;
}

type RedisConfig = {
  url: string;
  token: string;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | null;
};

// Validate environment variables
function getRedisConfig(): RedisConfig {
  const url = getRedisUrl();
  const token = getRedisToken();

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
  limiter: Ratelimit.slidingWindow({
    allowedTokens: (identifier: string) =>
      identifier === 'anonymous' ? 5 : 10,
    window: '60 s',
  }),
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
