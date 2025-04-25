import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '../redis/config';

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  prefix: '@upstash/ratelimit',
});