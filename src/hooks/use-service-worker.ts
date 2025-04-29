'use client';

import { useEffect, useState } from 'react';

export interface ServiceWorkerHook {
  isRegistered: boolean;
  error: Error | null;
}

export function useServiceWorker(): ServiceWorkerHook {
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => setIsRegistered(true))
        .catch(setError);
    }
  }, []);

  return { isRegistered, error };
}
