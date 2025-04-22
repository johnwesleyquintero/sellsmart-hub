import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { Redis as IRedis } from '@upstash/redis/types';

declare module '@upstash/ratelimit' {
  interface Ratelimit {
    slidingWindow(requests: number, window: string): any;
  }
}

if (!process.env.KV_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('Redis configuration missing in environment variables');
}

const redis: IRedis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/portfolio-chat',
});

export type RateLimiter = typeof rateLimiter;
