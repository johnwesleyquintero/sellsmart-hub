'use client';

import { logger } from '@/lib/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TaskOptions {
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  maxConcurrency?: number;
}

interface Task<T = unknown> {
  id: string;
  promise: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  options: TaskOptions;
  startTime: number;
  attempts: number;
}

function isTask<T>(task: unknown): task is Task<T> {
  return (
    typeof task === 'object' &&
    task !== null &&
    'id' in task &&
    'promise' in task &&
    'resolve' in task &&
    'reject' in task
  );
}

export function useBackgroundTasks() {
  const [activeTasks, setActiveTasks] = useState<Map<string, Task>>(new Map());
  const [running, setRunning] = useState(new Set<string>());
  const taskQueue = useRef<Task[]>([]);
  const isProcessing = useRef(false);

  // Process the task queue
  const processQueue = useCallback(async () => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      while (taskQueue.current.length > 0) {
        const task = taskQueue.current[0];
        if (!isTask(task)) {
          taskQueue.current.shift();
          continue;
        }
        const concurrentTasks = Array.from(running).filter(
          (id) =>
            activeTasks.get(id)?.options.priority === task.options.priority,
        ).length;

        if (concurrentTasks >= (task.options.maxConcurrency || 3)) {
          break;
        }

        taskQueue.current.shift();
        setRunning((prev) => new Set(prev).add(task.id));

        // Execute the task
        try {
          const result = await Promise.race([
            task.promise(),
            task.options.timeout
              ? new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error('Task timeout')),
                    task.options.timeout,
                  ),
                )
              : Promise.resolve(undefined),
          ]);

          task.resolve(result);
          logger.debug('Task completed successfully:', { taskId: task.id });
        } catch (error) {
          // Handle retries
          if (task.attempts < (task.options.retryCount || 0)) {
            task.attempts++;
            const delay = task.options.retryDelay || 1000;

            logger.debug('Retrying task:', {
              taskId: task.id,
              attempt: task.attempts,
              delay,
            });

            await new Promise((resolve) => setTimeout(resolve, delay));
            taskQueue.current.push(task);
          } else {
            task.reject(error as Error);
            logger.error('Task failed:', {
              taskId: task.id,
              error,
              attempts: task.attempts,
            });
          }
        } finally {
          setRunning((prev) => {
            const next = new Set(prev);
            next.delete(task.id);
            return next;
          });
        }
      }
    } finally {
      isProcessing.current = false;

      // Check if there are more tasks to process
      if (taskQueue.current.length > 0) {
        processQueue();
      }
    }
  }, [activeTasks]);

  // Queue a new task
  const queueTask = useCallback(
    <T>(task: Task<T>) => {
      const taskWithAttempts = {
        ...task,
        attempts: 0,
        resolve: (value: unknown) => task.resolve(value as T),
      };
      setActiveTasks((prev) => new Map(prev).set(task.id, taskWithAttempts));
      taskQueue.current.push(taskWithAttempts);
      processQueue();
    },
    [processQueue],
  );

  // Cancel a task
  const cancelTask = useCallback(
    (id: string) => {
      const task = activeTasks.get(id);
      if (!task) return;

      // Remove from queue if not started
      taskQueue.current = taskQueue.current.filter((t) => t.id !== id);

      // Reject the task
      task.reject(new Error('Task cancelled') as Error);

      // Clean up task state
      setActiveTasks((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });

      setRunning((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      logger.debug('Task cancelled:', { taskId: id });
    },
    [activeTasks],
  );

  // Check if a task is running
  const isTaskRunning = useCallback(
    (id: string) => {
      return running.has(id);
    },
    [running],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Cancel all tasks
      Array.from(activeTasks.keys()).forEach(cancelTask);
    };
  }, [activeTasks, cancelTask]);

  return {
    queueTask,
    cancelTask,
    isTaskRunning,
    activeTasks: Array.from(activeTasks.keys()),
    runningTasks: Array.from(running),
  };
}
