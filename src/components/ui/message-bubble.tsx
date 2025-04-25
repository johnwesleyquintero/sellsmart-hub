'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Message } from './chat-interface';

type MessageBubbleProps = {
  message: Message;
  onRetry?: (message: Message) => void;
  onDelete?: (timestamp: number) => void;
};

export function MessageBubble({
  message,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const { toast } = useToast();

  return (
    <div
      className={cn(
        'flex mb-4',
        message.role === 'user' ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'rounded-lg p-3 max-w-[80%] break-words shadow-sm',
          message.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
          message.status === 'error' && 'bg-red-100 dark:bg-red-900',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">{message.content}</div>

          {message.status === 'error' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry?.(message)}
              disabled={message.retryStatus === 'failed'}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(message.timestamp)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {message.error && (
          <div className="text-xs text-red-500 dark:text-red-300 mt-1">
            {message.error}
          </div>
        )}
      </div>
    </div>
  );
}
