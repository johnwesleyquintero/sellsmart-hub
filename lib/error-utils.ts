type ToastOptions = {
  variant?: "default" | "destructive";
  title?: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export interface ErrorWithRetry extends Error {
  retry?: () => Promise<void>;
}

export const showErrorToast = (options: ToastOptions) => {
  console.error(options.description);
  // TODO: Implement toast notification system
};

export const handleError = (error: ErrorWithRetry) => {
  console.error("Error:", error);

  showErrorToast({
    variant: "destructive",
    title: "Error",
    description: error.message,
    action: error.retry
      ? {
          label: "Retry",
          onClick: () => error.retry?.(),
        }
      : undefined,
  });
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries) break;

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw Object.assign(lastError!, {
    retry: () => withRetry(fn, maxRetries, delayMs),
  });
};

export const createRetryableError = (
  message: string,
  retryFn: () => Promise<void>,
): ErrorWithRetry => {
  return Object.assign(new Error(message), {
    retry: retryFn,
  });
};

export interface NetworkError extends ErrorWithRetry {
  statusCode?: number;
  isNetworkError: boolean;
}

export const isNetworkError = (error: any): error is NetworkError => {
  return error && typeof error === "object" && "isNetworkError" in error;
};

export const createNetworkError = (
  message: string,
  statusCode?: number,
  retryFn?: () => Promise<void>,
): NetworkError => {
  return Object.assign(new Error(message), {
    statusCode,
    isNetworkError: true,
    retry: retryFn,
  });
};
