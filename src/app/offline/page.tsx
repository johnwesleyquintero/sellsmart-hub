import { Button } from '@/components/ui/button';
import { RefreshCcw, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-4">
        <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <WifiOff className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            You&apos;re offline
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The content you&apos;re looking for isn&apos;t available offline.
            Please check your connection and try again.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="inline-flex items-center"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
