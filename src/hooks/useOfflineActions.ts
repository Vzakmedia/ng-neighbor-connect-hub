/**
 * Unified offline actions hook
 * Allows performing actions that queue when offline and sync when back online
 */

import { useCallback, useMemo } from 'react';
import { useNativeNetwork } from '@/hooks/mobile/useNativeNetwork';
import { useBackgroundSync, QueuedOperation, QueuedOperationType } from '@/hooks/mobile/useBackgroundSync';
import { useToast } from '@/hooks/use-toast';

// Extended action types (superset of QueuedOperationType)
export type OfflineActionType = QueuedOperationType | 'comment' | 'like' | 'save';

export interface OfflineActionResult<T = any> {
  success: boolean;
  queued: boolean;
  data?: T;
  error?: Error;
  operationId?: string;
}

export interface UseOfflineActionsReturn {
  /**
   * Perform an action that will be queued if offline
   */
  performAction: <T>(
    type: OfflineActionType,
    data: any,
    onlineAction: () => Promise<T>
  ) => Promise<OfflineActionResult<T>>;
  
  /**
   * Check if there are pending actions
   */
  hasPendingActions: boolean;
  
  /**
   * Get all pending actions
   */
  pendingActions: QueuedOperation[];
  
  /**
   * Check if currently syncing
   */
  isSyncing: boolean;
  
  /**
   * Get count of pending actions by type
   */
  pendingCounts: Record<OfflineActionType, number>;
  
  /**
   * Manually trigger sync
   */
  triggerSync: () => void;
  
  /**
   * Check if online
   */
  isOnline: boolean;
  
  /**
   * Check if sync is paused (low battery)
   */
  isPaused: boolean;
}

export function useOfflineActions(): UseOfflineActionsReturn {
  const { isOnline } = useNativeNetwork();
  const { 
    addToQueue, 
    queue, 
    isProcessing, 
    triggerSync, 
    hasQueuedItems,
    isPaused,
  } = useBackgroundSync();
  const { toast } = useToast();

  const performAction = useCallback(async <T>(
    type: OfflineActionType,
    data: any,
    onlineAction: () => Promise<T>
  ): Promise<OfflineActionResult<T>> => {
    if (isOnline) {
      try {
        // Execute immediately when online
        const result = await onlineAction();
        return {
          success: true,
          queued: false,
          data: result,
        };
      } catch (error) {
        console.error(`Online action failed for ${type}:`, error);
        
        // If online action fails due to network, queue it (only for queueable types)
        const queueableTypes: QueuedOperationType[] = ['post', 'message', 'update', 'upload'];
        if (error instanceof Error && 
            (error.message.includes('network') || 
             error.message.includes('fetch') ||
             error.message.includes('Failed to fetch')) &&
            queueableTypes.includes(type as QueuedOperationType)) {
          const operationId = addToQueue(type as QueuedOperationType, data);
          toast({
            title: "Action queued",
            description: "Will sync when connection is restored",
          });
          return {
            success: true, // Optimistically succeed
            queued: true,
            operationId,
          };
        }
        
        return {
          success: false,
          queued: false,
          error: error as Error,
        };
      }
    } else {
      // Queue for later when offline (only for queueable types)
      const queueableTypes: QueuedOperationType[] = ['post', 'message', 'update', 'upload'];
      if (!queueableTypes.includes(type as QueuedOperationType)) {
        return {
          success: false,
          queued: false,
          error: new Error('This action requires an internet connection'),
        };
      }
      
      const operationId = addToQueue(type as QueuedOperationType, data);
      
      toast({
        title: "Saved offline",
        description: "Will sync when you're back online",
      });
      
      return {
        success: true, // Optimistically succeed
        queued: true,
        operationId,
      };
    }
  }, [isOnline, addToQueue, toast]);

  const pendingCounts = useMemo(() => {
    const counts: Record<OfflineActionType, number> = {
      post: 0,
      message: 0,
      like: 0,
      save: 0,
      comment: 0,
      update: 0,
      upload: 0,
    };
    
    queue.forEach((op) => {
      if (op.type in counts) {
        counts[op.type as OfflineActionType]++;
      }
    });
    
    return counts;
  }, [queue]);

  return {
    performAction,
    hasPendingActions: hasQueuedItems,
    pendingActions: queue,
    isSyncing: isProcessing,
    pendingCounts,
    triggerSync,
    isOnline,
    isPaused,
  };
}

/**
 * Hook for creating an offline-aware mutation
 * Wraps a mutation function to automatically queue when offline
 */
export function useOfflineMutation<TData, TVariables>(
  type: OfflineActionType,
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    onQueued?: (operationId: string) => void;
  }
) {
  const { performAction } = useOfflineActions();

  const mutate = useCallback(async (variables: TVariables): Promise<OfflineActionResult<TData>> => {
    const result = await performAction<TData>(
      type,
      variables,
      () => mutationFn(variables)
    );

    if (result.success && !result.queued && result.data) {
      options?.onSuccess?.(result.data);
    } else if (result.queued && result.operationId) {
      options?.onQueued?.(result.operationId);
    } else if (!result.success && result.error) {
      options?.onError?.(result.error);
    }

    return result;
  }, [performAction, type, mutationFn, options]);

  return { mutate };
}
