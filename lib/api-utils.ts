import { createNetworkError, withRetry } from './error-utils';

export interface FetchOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  return withRetry(
    async () => {
      try {
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
          throw createNetworkError(
            `HTTP error! status: ${response.status}`,
            response.status,
            () => fetchWithRetry(url, options)
          );
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof TypeError) {
          throw createNetworkError(
            'Network request failed',
            undefined,
            () => fetchWithRetry(url, options)
          );
        }
        throw error;
      }
    },
    retries,
    retryDelay
  );
}