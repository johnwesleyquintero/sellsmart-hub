import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextApiRequest, NextApiResponse } from 'next';

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing required Redis environment variables (KV_REST_API_URL and KV_REST_API_TOKEN)',
    );
  }

  // Ensure URL starts with https://
  const validatedUrl = url.startsWith('https://')
    ? url
    : url.replace(/^rediss?:\/\//, 'https://');

  return {
    url: validatedUrl,
    token,
  };
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
