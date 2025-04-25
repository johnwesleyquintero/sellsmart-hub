import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextApiRequest, NextApiResponse } from 'next';

import { redis } from '../redis/config';

function getRedisConfig() {
  return redis;
}

export const rateLimiter = new Ratelimit({
  redis: new Redis(getRedisConfig()),
  limiter: Ratelimit.slidingWindow(15, '10 s'),
  analytics: true,
});

export async function rateLimitRequest(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
) {
  const identifier = Array.isArray(req.headers['x-forwarded-for'])
    ? req.headers['x-forwarded-for'][0]
    : req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
  const { success } = await rateLimiter.limit(identifier);
  if (!success) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  return next();
}

export type RateLimiter = typeof rateLimiter;
