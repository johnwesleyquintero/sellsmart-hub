declare module '@/lib/rate-limiter' {
  import { Ratelimit } from '@upstash/ratelimit';
  export const rateLimiter: Ratelimit;
}
