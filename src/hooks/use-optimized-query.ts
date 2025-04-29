'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useOptimizedQuery<TData, TError>(
  options: UseQueryOptions<TData, TError>,
) {
  const { data, error } = useQuery<TData, TError>({
    ...options,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (data || error) {
      // Handle completion
    }
  }, [data, error]);

  return { data, error };
}
