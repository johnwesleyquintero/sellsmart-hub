'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { OptimizationProvider } from '@/contexts/optimization-context';
import { useServiceWorker } from '@/hooks/use-service-worker';
import { monitor } from '@/lib/monitoring';
import { initWebVitals } from '@/lib/web-vitals';
import { useCacheStore } from '@/stores/cache-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RefreshCcw, WifiOff } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface ServiceWorkerState {
  isOffline: boolean;
  showReload: boolean;
  reloadPage: () => void;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function ClientProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  const { isOffline, showReload, reloadPage } =
    useServiceWorker() as unknown as ServiceWorkerState;
  const purgeExpiredCache = useCacheStore((state) => state.purgeExpired);

  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals();

    // Track page views and navigation
    monitor.trackNavigation(pathname || '/');

    // Periodically purge expired cache entries
    const cacheInterval = setInterval(purgeExpiredCache, 60000); // Every minute

    return () => {
      clearInterval(cacheInterval);
    };
  }, [pathname, purgeExpiredCache]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <OptimizationProvider>
          {isOffline && (
            <Alert
              variant="destructive"
              className="fixed top-4 right-4 w-auto z-50"
            >
              <WifiOff className="h-4 w-4" />
              <AlertTitle>You&apos;re offline</AlertTitle>
              <AlertDescription>
                Some features may be limited while offline.
              </AlertDescription>
            </Alert>
          )}

          {showReload && (
            <Alert className="fixed bottom-4 right-4 w-auto z-50">
              <AlertTitle>Update Available</AlertTitle>
              <AlertDescription className="flex items-center gap-4">
                <span>A new version is available.</span>
                <Button size="sm" onClick={reloadPage}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Update now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {children}
        </OptimizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
