import {
  getRedisValue,
  invalidateCacheByTag,
  setRedisValue,
} from '@/lib/redis';
import { create } from 'zustand';

interface CacheState {
  getItem: (key: string) => Promise<unknown>;
  setItem: (key: string, value: unknown, tags?: string[]) => Promise<void>;
  invalidateByTag: (tag: string) => Promise<void>;
}

// Function to get the cache prune interval from the environment variable
function getCachePruneInterval(): number {
  const interval = process.env.CACHE_PRUNE_INTERVAL;
  if (interval && !isNaN(Number(interval))) {
    return parseInt(interval, 10);
  }
  return 3600; // Default to 1 hour (3600 seconds)
}

export const useCacheStore = create<CacheState>(() => ({
  getItem: async (key: string) => {
    const redisValue = await getRedisValue(key);
    if (redisValue) {
      return redisValue;
    }

    return null;
  },
  setItem: async (key: string, value: unknown) => {
    await setRedisValue(key, value);
  },
  invalidateByTag: async () => {
    await invalidateCacheByTag();
  },
}));

// Implement cache pruning (example - adjust as needed)
const pruneInterval = getCachePruneInterval();
setInterval(() => {
  // Add logic here to prune the Redis cache based on your requirements
  // For example, you might remove entries that haven't been accessed in a while
  console.log('Cache pruning triggered');
}, pruneInterval * 1000);
