interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  saveData?: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

declare module '@/hooks/use-service-worker' {
  export function useServiceWorker(): void;
}

declare module '@/hooks/use-background-tasks' {
  export function useBackgroundTasks(): void;
}

declare module '@/hooks/use-network-monitor' {
  export function useNetworkMonitor(): {
    trackNavigation(path: string, context?: Record<string, unknown>): void;
    trackError(error: Error | string, context?: Record<string, unknown>): void;
  };
}

declare module '@/hooks/use-resource-loading' {
  export function useResourceLoading(): void;
}
