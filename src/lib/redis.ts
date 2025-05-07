import { cache } from './cache';

export async function getRedisValue(key: string): Promise<unknown> {
  try {
    const value = cache.get(key);
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function setRedisValue(
  key: string,
  value: unknown,
): Promise<void> {
  try {
    cache.set(key, value);
  } catch (error) {
    console.error(error);
  }
}

export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    const tagKey = `tags:*`; // Use a pattern to find all tag keys
    const keys = await cache.redis.scan(0, { MATCH: tagKey, COUNT: 100 });
    if (keys && keys[1].length > 0) {
      await cache.redis.del(...keys[1]);
    }
  } catch (error) {
    console.error(`[Cache] Error invalidating cache by tag: ${tag}`, error);
  }
}

export const Cache = {
  getItem: getRedisValue,
  setItem: setRedisValue,
};
