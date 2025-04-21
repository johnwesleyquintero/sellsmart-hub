import { toast } from '@/hooks/use-toast';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorLogEntry {
  message: string;
  component: string;
  timestamp: string;
  severity: ErrorSeverity;
  stack?: string;
  context?: Record<string, unknown>;
}

const errorLog: ErrorLogEntry[] = [];

export const logError = ({
  message,
  component,
  severity = 'medium',
  error,
  context = {},
}: {
  message: string;
  component: string;
  severity?: ErrorSeverity;
  error?: Error;
  context?: Record<string, unknown>;
}) => {
  const entry: ErrorLogEntry = {
    message,
    component,
    timestamp: new Date().toISOString(),
    severity,
    stack: error?.stack,
    context,
  };

  errorLog.push(entry);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${component}] ${message}`, { error, context });
  }

  // Show user-friendly toast notification
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });

  // In production, could send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Implement error reporting service integration
    // e.g., Sentry, LogRocket, etc.
  }
};

export const getErrorLog = () => errorLog;

export const clearErrorLog = () => {
  errorLog.length = 0;
};
