import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeStorage } from './useNativeStorage';
import { useNativeNetwork } from './useNativeNetwork';
import { useBatteryStatus } from './useBatteryStatus';
import { useToast } from '@/hooks/use-toast';

export interface QueuedOperation {
  id: string;
  type: 'post' | 'message' | 'upload' | 'update';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

const QUEUE_KEY = 'background_sync_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [0, 5000, 15000, 30000, 60000]; // Exponential backoff

export const useBackgroundSync = () => {
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { getItem, setItem } = useNativeStorage();
  const { isOnline, connectionType } = useNativeNetwork();
  const { shouldPauseBackgroundTasks, isLowBattery } = useBatteryStatus();
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  // Load queue from storage on mount
  useEffect(() => {
    loadQueue();
  }, []);

  // Save queue to storage whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      setItem(QUEUE_KEY, JSON.stringify(queue));
    } else {
      setItem(QUEUE_KEY, '[]');
    }
  }, [queue, setItem]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [isOnline, queue.length]);

  const loadQueue = async () => {
    const stored = await getItem(QUEUE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
      } catch (error) {
        console.error('Error loading sync queue:', error);
      }
    }
  };

  /**
   * Add operation to queue
   */
  const addToQueue = useCallback((
    type: QueuedOperation['type'],
    data: any,
    maxRetries = MAX_RETRIES
  ): string => {
    const operation: QueuedOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    setQueue(prev => [...prev, operation]);
    return operation.id;
  }, []);

  /**
   * Remove operation from queue
   */
  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(op => op.id !== id));
  }, []);

  /**
   * Update operation in queue
   */
  const updateOperation = useCallback((id: string, updates: Partial<QueuedOperation>) => {
    setQueue(prev => prev.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ));
  }, []);

  /**
   * Process queue with exponential backoff
   */
  const processQueue = useCallback(async () => {
    // Don't process if offline, already processing, or queue is empty
    if (!isOnline || isProcessing || queue.length === 0) return;

    // Pause sync on low battery (unless charging)
    if (shouldPauseBackgroundTasks) {
      console.log('Background sync paused due to low battery');
      return;
    }

    // Skip retry on airplane mode
    if (connectionType === 'none') {
      console.log('Background sync paused: no connection');
      return;
    }

    setIsProcessing(true);

    for (const operation of queue) {
      if (operation.retryCount >= operation.maxRetries) {
        // Max retries reached, notify user
        toast({
          title: "Sync failed",
          description: `Failed to sync ${operation.type} after ${operation.maxRetries} attempts`,
          variant: "destructive",
        });
        removeFromQueue(operation.id);
        continue;
      }

      // Calculate delay based on retry count
      const delay = RETRY_DELAYS[Math.min(operation.retryCount, RETRY_DELAYS.length - 1)];
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        // Process the operation (implement your sync logic here)
        await processOperation(operation);
        
        // Success - remove from queue
        removeFromQueue(operation.id);
        
        if (operation.retryCount > 0) {
          toast({
            title: "Synced successfully",
            description: `Your ${operation.type} has been synced`,
          });
        }
      } catch (error) {
        console.error(`Error processing ${operation.type}:`, error);
        
        // Update retry count and error
        updateOperation(operation.id, {
          retryCount: operation.retryCount + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setIsProcessing(false);
  }, [isOnline, isProcessing, queue, toast, removeFromQueue, updateOperation, shouldPauseBackgroundTasks, connectionType]);

  /**
   * Process individual operation (to be implemented by consumer)
   */
  const processOperation = async (operation: QueuedOperation): Promise<void> => {
    // This will be overridden by the consumer
    throw new Error('processOperation must be implemented');
  };

  /**
   * Manually trigger sync
   */
  const triggerSync = useCallback(() => {
    if (isOnline) {
      processQueue();
    } else {
      toast({
        title: "No internet connection",
        description: "Your changes will sync when you're back online",
      });
    }
  }, [isOnline, processQueue, toast]);

  /**
   * Clear all queued operations
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  /**
   * Get queue stats
   */
  const getQueueStats = useCallback(() => {
    return {
      total: queue.length,
      pending: queue.filter(op => op.retryCount === 0).length,
      retrying: queue.filter(op => op.retryCount > 0).length,
      failed: queue.filter(op => op.retryCount >= op.maxRetries).length,
    };
  }, [queue]);

  return {
    queue,
    isProcessing,
    addToQueue,
    removeFromQueue,
    updateOperation,
    triggerSync,
    clearQueue,
    getQueueStats,
    hasQueuedItems: queue.length > 0,
    isNative,
    isPaused: shouldPauseBackgroundTasks,
    batteryOptimized: isLowBattery,
  };
};
