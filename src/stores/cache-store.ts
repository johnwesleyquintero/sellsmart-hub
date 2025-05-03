import { getRedisValue, setRedisValue } from '@/lib/redis';
import { create } from 'zustand';

interface CacheState {
  cache: Record<string, any>;
  getItem: (key: string) => Promise<any>;
  setItem: (key: string, value: any) => Promise<void>;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  cache: {},
  getItem: async (key: string) => {
    const cachedValue = get().cache[key];
    if (cachedValue) {
      return cachedValue;
    }

    const redisValue = await getRedisValue(key);
    if (redisValue) {
      set((state) => ({
        cache: { ...state.cache, [key]: redisValue },
      }));
      return redisValue;
    }

    return null;
  },
  setItem: async (key: string, value: any) => {
    set((state) => ({
      cache: { ...state.cache, [key]: value },
    }));
    await setRedisValue(key, value);
  },
}));
