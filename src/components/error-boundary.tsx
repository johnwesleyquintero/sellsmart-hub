'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      setHasError(true);
      setError(error.error);
      console.error('Error caught by error boundary:', error);
    };

    window.addEventListener('error', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-800/30 dark:bg-red-900/20">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-500 dark:text-red-400" />
        <h2 className="mb-2 text-xl font-bold text-red-800 dark:text-red-400">
          Something went wrong
        </h2>
        {/* New error documentation note */}
        <p className="mb-4 text-sm text-muted-foreground">
          Please refer to the{' '}
          <a href="/docs/error-guide.md" className="underline">
            error guide
          </a>{' '}
          for further details.
        </p>
        <p className="mb-6 max-w-md text-red-700 dark:text-red-300">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <Button
          onClick={() => {
            setHasError(false);
            setError(null);
            window.location.reload();
          }}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </Button>
        {error && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 max-w-md overflow-auto rounded border border-red-300 bg-white p-4 text-left text-sm text-red-800 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-300">
            <p className="font-mono font-bold">
              {error.name}: {error.message}
            </p>
            <pre className="mt-2 text-xs">{error.stack}</pre>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
