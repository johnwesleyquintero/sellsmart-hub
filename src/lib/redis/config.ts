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
let redis: UpstashRedis;

try {
  redis = new UpstashRedis(getRedisConfig());
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  redis = new Proxy({} as UpstashRedis, {
    get: (target, prop) => {
      if (prop === 'ping') {
        return async () => {
          console.warn('Redis ping failed - using fallback');
          return 'PONG';
        };
      }
      if (prop === 'hincrby') {
        return async () => {
          console.warn('Redis hincrby failed - using fallback');
          return 0;
        };
      }
      if (prop === 'eval') {
        return async () => {
          console.warn('Redis eval failed - using fallback');
          return null;
        };
      }
      console.warn(
        `Redis method ${String(prop)} not available - using fallback`,
      );
      return () => undefined;
    },
  }) as any;
}

// Configure rate limiting
export const rateLimiter = new Ratelimit({
  // @ts-expect-error
  redis,
  // @ts-expect-error
  limiter: Ratelimit.slidingWindow({
    allowedTokens: (identifier: string) =>
      identifier === 'anonymous' ? 5 : 10,
    window: 60 * 1000,
  }),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Helper function to check Redis connection
export async function checkRedisConnection(): Promise<boolean> {
  if (!process.env.REDIS_URL && !process.env.KV_URL) {
    console.warn('Redis URL not configured - falling back to memory');
    return false;
  }
  console.log('REDIS_URL:', process.env.REDIS_URL);
  console.log('KV_URL:', process.env.KV_URL);
  console.log('REDIS_TOKEN:', process.env.REDIS_TOKEN);
  console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN);
  try {
    // @ts-expect-error
    if (typeof redis.ping === 'function') {
      // @ts-expect-error
      await redis.ping();
      return true;
    } else {
      console.warn('Redis ping is not a function - using fallback');
      return false;
    }
  } catch (error) {
    console.error('Redis connection error:', error);
    // Add fallback logic here if needed
    return false;
  }
}
