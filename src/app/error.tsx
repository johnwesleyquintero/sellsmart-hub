'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container flex max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <AlertTriangle className="mb-6 h-16 w-16 text-red-500" />
        <h1 className="mb-4 text-2xl font-bold md:text-3xl">
          Something went wrong!
        </h1>
        <p className="mb-8 text-muted-foreground">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        {/* New error documentation note */}
        <p className="mb-8 text-sm text-muted-foreground">
          For more details see the{' '}
          <a href="/docs/error-guide.md" className="underline">
            error guide
          </a>
          .
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={reset}
            variant="default"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
