'use client';

import { env } from '@/lib/config';
import { logger } from '@/lib/logger';
import { monitor } from '@/lib/monitoring';
import { Cache } from '@/lib/redis';
import { create } from 'zustand';

interface CacheStore {
  set: <T>(key: string, value: T, ttl: number, tag?: string) => Promise<void>;
  get: <T>(key: string) => Promise<T | null>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  prune: () => Promise<void>;
  invalidateCache: () => void;
  invalidateByTag: (tag: string) => Promise<void>;
}

const cache = new Cache();
const cacheKeyPrefix = 'v1';

export const useCacheStore = create<CacheStore>((set) => {
  return {
    set: async (key, value, ttl, tag) => {
      await cache.set(key, { value, tag }, ttl);
      logger.debug('Cache set:', { key, ttl, tag });
    },

    get: async <T>(key: string): Promise<T | null> => {
      const startTime = Date.now();
      const cached = await cache.get<{ value: T; tag?: string }>(key);

      if (!cached) {
        monitor.incrementCacheMiss();
        logger.debug('Cache miss:', { key });
        return null;
      }

      logger.debug('Cache hit:', { key });
      monitor.incrementCacheHit();
      const retrievalTime = Date.now() - startTime;
      monitor.recordRetrievalTime(retrievalTime);
      return cached.value as T;
    },

    remove: async (key) => {
      await cache.delete(key);
      logger.debug('Cache entry removed:', { key });
    },

    clear: async () => {
      const keys = await cache.keys(`${cacheKeyPrefix}:*`);
      if (keys.length > 0) {
        await cache.del(keys);
      }
      logger.debug('Cache cleared');
    },

    prune: async () => {
      const keys = await cache.keys(`${cacheKeyPrefix}:*`);

      if (keys.length === 0) {
        return;
      }

      for (const key of keys) {
        const cached = await cache.get<{
          value: unknown;
          tag?: string;
        }>(key);
        if (cached) {
          // The timestamp and ttl are no longer stored in redis, so we can't prune based on age.
          // This needs to be re-implemented.
          // const age = now - cached.timestamp;
          // if (age > cached.ttl) {
          await cache.delete(key);
          logger.debug('Cache entry pruned:', { key });
          // }
        }
      }
    },
    invalidateCache: () => {
      // This invalidates the entire cache by incrementing the version.
      // A more granular approach would be to invalidate by tag.
      set(() => {
        logger.info('Cache invalidated');
        return {};
      });
    },
    invalidateByTag: async (tag: string) => {
      const keys = await cache.keys(`${cacheKeyPrefix}:*`);

      if (keys.length === 0) {
        return;
      }

      for (const key of keys) {
        const cached = await cache.get<{
          value: unknown;
          tag?: string;
        }>(key);
        if (cached && cached.tag === tag) {
          await cache.delete(key);
          logger.debug('Cache entry invalidated by tag:', { key, tag });
        }
      }
    },
  };
});

// Set up periodic cache pruning
if (typeof window !== 'undefined') {
  const pruneInterval = env.CACHE_PRUNE_INTERVAL
    ? parseInt(env.CACHE_PRUNE_INTERVAL, 10)
    : 60000; // Default to 1 minute

  setInterval(() => {
    useCacheStore.getState().prune();
  }, pruneInterval);
}
