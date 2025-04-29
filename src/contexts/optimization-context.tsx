'use client';

import { useBackgroundTasks } from '@/hooks/use-background-tasks';
import { useNetworkMonitor } from '@/hooks/use-network-monitor';
import { useResourceLoading } from '@/hooks/use-resource-loading';
import { logger } from '@/lib/logger';
import { usePreferences } from '@/lib/preferences';
import React, { createContext, useCallback, useContext } from 'react';

interface NetworkInterface {
  online: boolean;
  shouldThrottleRequests: () => boolean;
  saveData: boolean;
  trackNavigation: (path: string) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
}

interface ResourceLoader {
  loadResource: (url: string, options: ResourceOptions) => Promise<void>;
  loadResourceBatch: (urls: string[], options?: BatchOptions) => Promise<void>;
  isLoading: (url: string) => boolean;
  getProgress: (url: string) => number;
  getError: (url: string) => Error | null;
  getResourceStatus: (id: string) => {
    isLoading: boolean;
    progress: number;
    error: null | Error;
  };
}

interface BackgroundTasks {
  queueTask: <T>(
    id: string,
    task: () => Promise<T>,
    options: TaskOptions,
  ) => Promise<T>;
  cancelTask: (id: string) => void;
  isTaskRunning: (id: string) => boolean;
}

interface TaskOptions {
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
  retries?: number;
}

interface ResourceOptions {
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
  cache?: boolean;
  retries?: number;
}

interface BatchOptions extends ResourceOptions {
  concurrency?: number;
}

interface OptimizationContextType {
  // Network state
  isOnline: boolean;
  networkQuality: 'good' | 'poor' | 'offline';
  shouldOptimizeData: boolean;

  // Resource loading
  loadResource: (url: string, options?: ResourceOptions) => Promise<void>;
  loadResourceBatch: (urls: string[], options?: BatchOptions) => Promise<void>;
  getResourceStatus: (id: string) => {
    isLoading: boolean;
    progress: number;
    error: Error | null;
  };

  // Background tasks
  queueTask: <T>(
    id: string,
    task: () => Promise<T>,
    options?: TaskOptions,
  ) => Promise<T>;
  cancelTask: (id: string) => void;
  isTaskRunning: (id: string) => boolean;
}

const OptimizationContext = createContext<OptimizationContextType | null>(null);

export function OptimizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferences = usePreferences();
  const network = useNetworkMonitor() as NetworkInterface;
  const backgroundTasks = useBackgroundTasks() as unknown as BackgroundTasks;
  const resourceLoader = useResourceLoading() as unknown as ResourceLoader;

  // Determine network quality based on multiple factors
  const networkQuality = useCallback((): 'good' | 'poor' | 'offline' => {
    if (!network.online) return 'offline';
    if (
      network.shouldThrottleRequests() ||
      preferences.prefersReducedData ||
      network.saveData
    ) {
      return 'poor';
    }
    return 'good';
  }, [network, preferences.prefersReducedData]);

  // Determine if we should optimize data usage
  const shouldOptimizeData = useCallback((): boolean => {
    return (
      networkQuality() === 'poor' ||
      preferences.prefersReducedData ||
      network.saveData
    );
  }, [networkQuality, preferences.prefersReducedData, network.saveData]);

  // Resource loading with optimization
  const loadResource = useCallback(
    async (url: string, options?: ResourceOptions) => {
      try {
        // Skip low priority resources when optimizing
        if (shouldOptimizeData() && options?.priority === 'low') {
          logger.debug(
            'Skipping low priority resource due to optimization:',
            url,
          );
          return;
        }

        await resourceLoader.loadResource(url, {
          ...options,
          timeout: options?.priority === 'high' ? 10000 : 30000,
          retries: options?.priority === 'high' ? 3 : 1,
        });
      } catch (error) {
        logger.error('Failed to load resource:', error);
        throw error;
      }
    },
    [resourceLoader, shouldOptimizeData],
  );

  // Batch resource loading with prioritization
  const loadResourceBatch = useCallback(
    async (urls: string[], options?: BatchOptions) => {
      const optimizedUrls = shouldOptimizeData()
        ? urls.filter(() => options?.priority !== 'low')
        : urls;

      await resourceLoader.loadResourceBatch(optimizedUrls, {
        ...options,
        timeout: options?.priority === 'high' ? 10000 : 30000,
        retries: options?.priority === 'high' ? 3 : 1,
      });
    },
    [resourceLoader, shouldOptimizeData],
  );

  // Queue background task with network awareness
  const queueTask = useCallback(
    async <T,>(
      id: string,
      task: () => Promise<T>,
      options?: TaskOptions,
    ): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        (
          backgroundTasks.queueTask as <T>(
            id: string,
            task: () => Promise<T>,
            options: TaskOptions,
          ) => Promise<T>
        )(id, task, options || {})
          .then(resolve)
          .catch(reject);
      });
    },
    [backgroundTasks],
  );

  const value: OptimizationContextType = {
    isOnline: network.online,
    networkQuality: networkQuality(),
    shouldOptimizeData: shouldOptimizeData(),

    loadResource,
    loadResourceBatch,
    getResourceStatus: (id: string) => {
      const { isLoading, progress, error } = resourceLoader.getResourceStatus(
        id,
      ) ?? {
        isLoading: false,
        progress: 0,
        error: null,
      };
      return { isLoading, progress, error };
    },

    queueTask,
    cancelTask: backgroundTasks.cancelTask,
    isTaskRunning: backgroundTasks.isTaskRunning,
  };

  return (
    <OptimizationContext.Provider value={value}>
      {children}
    </OptimizationContext.Provider>
  );
}

export function useOptimization() {
  const context = useContext(OptimizationContext);
  if (!context) {
    throw new Error(
      'useOptimization must be used within an OptimizationProvider',
    );
  }
  return context;
}
