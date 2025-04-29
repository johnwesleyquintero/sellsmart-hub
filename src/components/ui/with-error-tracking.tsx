'use client';

import { RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { ErrorBoundary } from './error-boundary';

interface WithErrorTrackingProps {
  id: string;
  fallback?: React.ReactNode;
}

export function withErrorTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorTrackingProps,
) {
  return function WithErrorTracking(props: P) {
    const defaultFallback = (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-4">
          <p>
            An error occurred while rendering this component. Our team has been
            notified and is working to fix the issue.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-fit"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </AlertDescription>
      </Alert>
    );

    return (
      <ErrorBoundary fallback={options.fallback || defaultFallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
