'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { ErrorBoundary } from './error-boundary';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            fallback || (
              <Alert variant="destructive" className="m-4">
                <AlertTitle>Failed to load data</AlertTitle>
                <AlertDescription className="mt-2 flex flex-col gap-4">
                  <p>
                    There was an error loading the data. Please try again or
                    contact support if the problem persists.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 w-fit"
                    onClick={reset}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </AlertDescription>
              </Alert>
            )
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
