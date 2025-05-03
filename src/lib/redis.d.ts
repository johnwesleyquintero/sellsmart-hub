declare module '@/lib/redis' {
  import { Redis as UpstashRedis } from '@upstash/redis';

  interface UpstashRedisType {
    ping(): Promise<string>;
    hincrby(key: string, field: string, increment: number): Promise<number>;
    eval(...args: any[]): Promise<any>;
  }

  export const redis: UpstashRedis & UpstashRedisType;
}
