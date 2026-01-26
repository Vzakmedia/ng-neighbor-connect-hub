import { useState, useEffect, useCallback } from 'react';
import { useNativeStorage } from './useNativeStorage';
import { useNativeNetwork } from './useNativeNetwork';
import { useBatteryStatus } from './useBatteryStatus';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

// Exported type for queue operation types
export type QueuedOperationType = 'post' | 'message' | 'upload' | 'update';

export interface QueuedOperation {
  id: string;
  type: QueuedOperationType;
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
  const isNative = isNativePlatform();

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
    type: QueuedOperationType,
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
   * Process individual operation
   * Handles different operation types with Supabase
   */
  const processOperation = async (operation: QueuedOperation): Promise<void> => {
    const { type, data } = operation;

    switch (type) {
      case 'post': {
        // Create a community post
        const { error } = await supabase
          .from('community_posts')
          .insert({
            title: data.title,
            content: data.content,
            post_type: data.post_type || 'general',
            tags: data.tags || [],
            location: data.location,
            image_urls: data.image_urls || [],
            user_id: data.user_id,
          });
        if (error) throw error;
        break;
      }

      case 'message': {
        // Send a direct message
        const { error } = await supabase
          .from('direct_messages')
          .insert({
            conversation_id: data.conversation_id,
            sender_id: data.sender_id,
            content: data.content,
            message_type: data.message_type || 'text',
          });
        if (error) throw error;
        break;
      }

      case 'update': {
        // Generic update operation
        // Note: Using 'as any' because table name is dynamic
        const { table, id, updates, match_field = 'id' } = data;
        const { error } = await (supabase as any)
          .from(table)
          .update(updates)
          .eq(match_field, id);
        if (error) throw error;
        break;
      }

      case 'upload': {
        // Handle file upload
        const { bucket, path, file, contentType } = data;
        
        // Convert base64 back to blob if needed
        let fileData = file;
        if (typeof file === 'string' && file.startsWith('data:')) {
          const response = await fetch(file);
          fileData = await response.blob();
        }

        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, fileData, { contentType });
        if (error) throw error;
        break;
      }

      default:
        console.warn(`Unknown operation type: ${type}`);
        throw new Error(`Unknown operation type: ${type}`);
    }
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
