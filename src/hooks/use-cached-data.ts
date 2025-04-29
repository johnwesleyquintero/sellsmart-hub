'use client';

import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useCacheStore } from '@/stores/cache-store';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface UseCachedDataOptions<T> {
  key: string;
  fetchAction: () => Promise<T>;
  ttl?: number;
  staleTime?: number;
  onError?: (error: Error) => void;
}

export function useCachedData<T>({
  key,
  fetchAction,
  ttl = 3600000, // 1 hour default
  staleTime = 300000, // 5 minutes default
  onError,
}: UseCachedDataOptions<T>) {
  const [isStale, setIsStale] = useState(false);
  const { get: getFromCache, set: setInCache } = useCacheStore();

  // Wrap fetchAction with cache logic
  const fetchWithCache = async () => {
    const startTime = performance.now();
    try {
      // Check cache first
      const cached = getFromCache<T>(key);
      if (cached) {
        analytics.trackPerformance(
          `cache_hit_${key}`,
          performance.now() - startTime,
        );
        return cached;
      }

      // Fetch fresh data
      const data = await fetchAction();
      setInCache(key, data, ttl);
      analytics.trackPerformance(
        `cache_miss_${key}`,
        performance.now() - startTime,
      );
      return data;
    } catch (error) {
      analytics.trackError(
        error instanceof Error ? error : new Error('Fetch error'),
        {
          key,
          duration: performance.now() - startTime,
        },
      );
      throw error;
    }
  };

  // Use React Query for data fetching
  const query = useQuery<T, Error>({
    queryKey: ['cached-data', key],
    queryFn: fetchWithCache,
    staleTime,
    gcTime: staleTime * 2,
    retry: 1,
  });

  useEffect(() => {
    if (query.error) {
      logger.error('Cache query error:', query.error);
      if (onError && query.error instanceof Error) {
        onError(query.error);
      }
    }
  }, [query.error, onError]);

  // Add error handling with onError callback
  useEffect(() => {
    if (query.error) {
      logger.error('Cache query error:', query.error);
      if (onError && query.error instanceof Error) {
        onError(query.error);
      }
    }
  }, [query.error, onError]);

  // Check for stale data
  useEffect(() => {
    const checkStale = () => {
      const cached = getFromCache<T>(key);
      if (cached) {
        const cacheState = useCacheStore.getState();
        const cacheEntry = cacheState.cache.get(key); // Using Map's get() method
        if (cacheEntry) {
          const isDataStale = Date.now() - cacheEntry.timestamp > staleTime;
          setIsStale(isDataStale);

          if (isDataStale) {
            logger.debug('Data is stale, triggering refresh:', { key });
            void query.refetch();
          }
        }
      }
    };

    checkStale();
    const interval = setInterval(checkStale, staleTime);

    return () => clearInterval(interval);
  }, [key, staleTime, query]);

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isStale,
    refetch: query.refetch,
  };
}
