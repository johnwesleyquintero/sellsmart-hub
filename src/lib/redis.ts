import { Redis as IORedis } from 'ioredis';
import { env } from './config';
import { logger } from './logger';

const REDIS_CONFIG = {
  url: env.REDIS_URL,
  password: env.REDIS_TOKEN,
};

export class RedisClient extends IORedis {
  constructor() {
    super(REDIS_CONFIG);
  }

  async setWithTtl(
    key: string,
    value: unknown,
    ttl?: number,
  ): Promise<'OK' | null> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        return await this.set(key, serializedValue, 'EX', ttl);
      }
      return await this.set(key, serializedValue);
    } catch (error) {
      logger.error('Redis set error:', { error, key });
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await super.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', { error, key });
      return null;
    }
  }
}

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class Cache {
  private prefix: string;
  private redis: RedisClient;

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || 'cache:';
    this.redis = new RedisClient();
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (env.NODE_ENV === 'test') {
      return null; // Skip cache in test environment
    }

    try {
      return await this.redis.get<T>(this.getKey(key));
    } catch (error) {
      logger.error('Redis get error:', { error, key });
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    if (env.NODE_ENV === 'test') {
      return; // Skip cache in test environment
    }

    try {
      await this.redis.setWithTtl(this.getKey(key), value, ttl);
    } catch (error) {
      logger.error('Redis set error:', { error, key });
    }
  }

  async delete(key: string): Promise<void> {
    if (env.NODE_ENV === 'test') {
      return; // Skip cache in test environment
    }

    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      logger.error('Redis delete error:', { error, key });
    }
  }

  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T | null> {
    if (env.NODE_ENV === 'test') {
      return fn(); // Skip cache in test environment
    }

    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached) {
        return cached;
      }

      // If not in cache, execute function and cache result
      const result = await fn();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      logger.error('Redis wrap error:', { error, key });
      return null;
    }
  }
}
