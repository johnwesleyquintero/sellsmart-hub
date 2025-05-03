'use client';

import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { useCacheStore } from '@/stores/cache-store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

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
  const { get: getFromCache, set: setInCache } = useCacheStore();

  // Wrap fetchAction with cache logic
  const fetchWithCache = async (): Promise<T> => {
    const startTime = performance.now();
    try {
      // Check cache first
      const cached = await getFromCache<T>(key);
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

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
