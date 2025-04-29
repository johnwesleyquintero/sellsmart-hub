'use client';

import { logger } from '@/lib/logger';
import { create } from 'zustand';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  cache: Map<string, CacheEntry<unknown>>;
  set: <T>(key: string, value: T, ttl: number) => void;
  get: <T>(key: string) => T | null;
  remove: (key: string) => void;
  clear: () => void;
  prune: () => void;
  purgeExpired: () => void; // Add missing method
}

export const useCacheStore = create<CacheStore>((set, get) => ({
  cache: new Map(),

  set: (key, value, ttl) => {
    const entry: CacheEntry<unknown> = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    get().cache.set(key, entry);
    logger.debug('Cache set:', { key, ttl });
    set({ cache: get().cache });
  },

  get: <T>(key: string): T | null => {
    const entry = get().cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      get().remove(key);
      logger.debug('Cache entry expired:', { key });
      return null;
    }

    logger.debug('Cache hit:', { key });
    return entry.value as T;
  },

  remove: (key) => {
    get().cache.delete(key);
    logger.debug('Cache entry removed:', { key });
    set({ cache: get().cache });
  },

  clear: () => {
    get().cache.clear();
    logger.debug('Cache cleared');
    set({ cache: new Map() });
  },

  prune: () => {
    const now = Date.now();
    let pruned = 0;

    for (const [key, entry] of get().cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        get().cache.delete(key);
        pruned++;
      }
    }

    if (pruned > 0) {
      logger.debug('Cache pruned:', { entriesRemoved: pruned });
      set({ cache: get().cache });
    }
  },

  purgeExpired: () => {
    const now = Date.now();
    let purged = 0;

    for (const [key, entry] of get().cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        get().cache.delete(key);
        purged++;
      }
    }

    if (purged > 0) {
      logger.debug('Cache purged:', { entriesRemoved: purged });
      set({ cache: get().cache });
    }
  },
}));

// Set up periodic cache pruning
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().prune();
  }, 60000); // Prune every minute
}
