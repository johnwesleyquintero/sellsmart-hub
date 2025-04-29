import { useCallback, useState } from 'react';

export function useResourceLoading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadResource = useCallback(async (resourceUrl: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(resourceUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load resource'),
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, loadResource };
}
