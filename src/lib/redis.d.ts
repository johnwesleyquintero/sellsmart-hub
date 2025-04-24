declare module '@/lib/redis' {
  import { Redis } from '@upstash/redis';
  export const redis: Redis;
}
