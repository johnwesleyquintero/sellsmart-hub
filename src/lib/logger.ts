import { monitor } from './monitoring';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data ? { data } : {}),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry = this.formatLogEntry(level, message, data);

    // Development logging
    if (this.isDevelopment) {
      const consoleMethod =
        level === 'error'
          ? 'error'
          : level === 'warn'
            ? 'warn'
            : level === 'debug'
              ? 'debug'
              : 'log';

      console[consoleMethod](
        `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`,
        data ? '\n' : '',
        data || '',
      );
    }

    // Production logging
    if (process.env.NODE_ENV === 'production') {
      // Track errors in monitoring system
      if (level === 'error') {
        monitor.trackError(data instanceof Error ? data : new Error(message), {
          ...entry,
        });
      }

      // Send to logging service if configured
      if (process.env.NEXT_PUBLIC_LOGGING_ENDPOINT) {
        fetch(process.env.NEXT_PUBLIC_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch((error) => {
          console.error('Failed to send log to logging service:', error);
        });
      }
    }
  }

  debug(message: string, data?: unknown) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown) {
    this.log('error', message, error);
  }

  // Create child logger with context
  child(context: Record<string, unknown>) {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, data?: unknown) => {
      originalLog(level, message, {
        ...context,
        ...(data ? { data } : {}),
      });
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();
