import { Redis as IORedis } from 'ioredis';
import Opossum from 'opossum';
import pRetry from 'p-retry';
import { env } from './config';
import { logger } from './logger';

const REDIS_CONFIG = {
  url: env.REDIS_URL,
  password: env.REDIS_TOKEN,
};

interface RetryError extends Error {
  attemptNumber: number;
}

export class RedisClient extends IORedis {
  private circuitBreaker: Opossum;
  public isReady: boolean = false;

  constructor() {
    super(REDIS_CONFIG);

    this.circuitBreaker = new Opossum(this.connectToRedis.bind(this), {
      timeout: 3000, // If our function doesn't return in 3 seconds, consider it a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
      resetTimeout: 10000, // After 10 seconds, try again.
    });

    this.circuitBreaker.on('open', () =>
      logger.warn('Redis circuit breaker OPEN'),
    );
    this.circuitBreaker.on('halfOpen', () =>
      logger.info('Redis circuit breaker HALF_OPEN'),
    );
    this.circuitBreaker.on('close', () =>
      logger.info('Redis circuit breaker CLOSED'),
    );
  }

  private async connectToRedis(): Promise<void> {
    try {
      await pRetry(
        async () => {
          if (!this.isReady) {
            await this.connect();
            this.isReady = true;
          }
        },
        {
          retries: 3,
          onFailedAttempt: (error: unknown) => {
            logger.warn(
              `Attempt ${(error as RetryError).attemptNumber} failed. Retrying...`,
            );
          },
        },
      );
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis after multiple retries:', error);
      throw error; // This will trip the circuit breaker
    }
  }

  async setWithTtl(
    key: string,
    value: unknown,
    ttl?: number,
  ): Promise<'OK' | null> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        const result = await this.retryRedisCall(
          () =>
            this.circuitBreaker.fire(() =>
              this.set(key, serializedValue, 'EX', ttl),
            ),
          key,
        );
        return result as 'OK' | null;
      }
      const result = await this.retryRedisCall(
        () => this.circuitBreaker.fire(() => this.set(key, serializedValue)),
        key,
      );
      return result as 'OK' | null;
    } catch (error) {
      logger.error('Redis set error:', { error, key });
      return null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.retryRedisCall(
        () => this.circuitBreaker.fire(() => super.get(key)),
        key,
      );
      return value ? JSON.parse(value as string) : null;
    } catch (error) {
      logger.error('Redis get error:', { error, key });
      return null;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const result = await this.retryRedisCall(
        () => this.circuitBreaker.fire(() => super.keys(pattern)),
        pattern,
      );
      return (result as string[]) || [];
    } catch (error) {
      logger.error('Redis keys error:', { error, pattern });
      return [];
    }
  }

  private async retryRedisCall<T>(
    fn: () => Promise<T>,
    key: string,
  ): Promise<T | null> {
    try {
      return await pRetry(fn, {
        retries: 3,
        onFailedAttempt: (error: unknown) => {
          logger.warn(
            `Redis operation failed for key ${key}, attempt ${(error as RetryError).attemptNumber}. Retrying...`,
          );
        },
      });
    } catch (error) {
      logger.error(
        `Redis operation failed after multiple retries for key ${key}:`,
        error,
      );
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

  async set(
    key: string,
    value: { value: any; tag?: string },
    ttl?: number,
  ): Promise<void> {
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

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(this.getKey(pattern));
    } catch (error) {
      logger.error('Redis keys error:', { error, pattern });
      return [];
    }
  }

  async del(keys: string | string[]): Promise<void> {
    try {
      if (typeof keys === 'string') {
        await this.redis.del(this.getKey(keys));
      } else {
        await Promise.all(
          keys.map(async (key: string) => {
            await this.redis.del(this.getKey(key));
          }),
        );
      }
    } catch (error) {
      logger.error('Redis delete error:', { error, keys });
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
      await this.set(key, { value: result }, ttl);
      return result;
    } catch (error) {
      logger.error('Redis wrap error:', { error, key });
      return null;
    }
  }
}
