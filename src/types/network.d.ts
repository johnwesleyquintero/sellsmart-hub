declare module '@/hooks/use-network-monitor' {
  export function useNetworkMonitor(): {
    trackNavigation: (path: string) => void;
    trackError: (error: Error, context?: Record<string, unknown>) => void;
  };
}

declare module '@/hooks/use-background-tasks' {
  export function useBackgroundTasks(): void;
}

declare module '@/hooks/use-resource-loading' {
  export function useResourceLoading(): void;
}
