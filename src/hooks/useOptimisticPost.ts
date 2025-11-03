import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdate<T> {
  id: string;
  data: T;
  timestamp: number;
  isPending: boolean;
}

export const useOptimisticPost = <T extends { id?: string }>(queryKey: string[]) => {
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Add optimistic update
   */
  const addOptimistic = useCallback((data: T, tempId: string) => {
    const update: OptimisticUpdate<T> = {
      id: tempId,
      data,
      timestamp: Date.now(),
      isPending: true
    };

    setPendingUpdates(prev => new Map(prev).set(tempId, update));

    // Optimistically update the query cache
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return [data];
      if (Array.isArray(old)) return [data, ...old];
      return data;
    });

    return tempId;
  }, [queryClient, queryKey]);

  /**
   * Confirm optimistic update (when server confirms)
   */
  const confirmOptimistic = useCallback((tempId: string, serverData?: T) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });

    // Update with server data if provided
    if (serverData) {
      queryClient.setQueryData(queryKey, (old: any) => {
        if (Array.isArray(old)) {
          return old.map(item => 
            item.id === tempId ? serverData : item
          );
        }
        return serverData;
      });
    }
  }, [queryClient, queryKey]);

  /**
   * Revert optimistic update (on error)
   */
  const revertOptimistic = useCallback((tempId: string) => {
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });

    // Remove from query cache
    queryClient.setQueryData(queryKey, (old: any) => {
      if (Array.isArray(old)) {
        return old.filter(item => item.id !== tempId);
      }
      return null;
    });

    toast({
      title: "Update failed",
      description: "Your changes couldn't be saved",
      variant: "destructive",
    });
  }, [queryClient, queryKey, toast]);

  /**
   * Check if an item is pending
   */
  const isPending = useCallback((id: string) => {
    return pendingUpdates.has(id);
  }, [pendingUpdates]);

  return {
    addOptimistic,
    confirmOptimistic,
    revertOptimistic,
    isPending,
    pendingCount: pendingUpdates.size
  };
};
