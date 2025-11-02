import { useState, useEffect, useCallback } from 'react';
import { Message } from './useDirectMessages';

interface QueuedMessage {
  tempId: string;
  content: string;
  recipientId: string;
  timestamp: number;
  retryCount: number;
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'file';
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
}

const QUEUE_KEY = 'message_queue';
const MAX_RETRIES = 3;

export const useMessageQueue = (userId: string | undefined) => {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);

  // Load queue from localStorage on mount
  useEffect(() => {
    if (!userId) return;
    
    const stored = localStorage.getItem(`${QUEUE_KEY}_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setQueue(parsed);
      } catch (error) {
        console.error('Error loading message queue:', error);
      }
    }
  }, [userId]);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (!userId) return;
    
    if (queue.length === 0) {
      localStorage.removeItem(`${QUEUE_KEY}_${userId}`);
    } else {
      localStorage.setItem(`${QUEUE_KEY}_${userId}`, JSON.stringify(queue));
    }
  }, [queue, userId]);

  const addToQueue = useCallback((message: QueuedMessage) => {
    setQueue(prev => [...prev, message]);
  }, []);

  const removeFromQueue = useCallback((tempId: string) => {
    setQueue(prev => prev.filter(msg => msg.tempId !== tempId));
  }, []);

  const updateRetryCount = useCallback((tempId: string) => {
    setQueue(prev => 
      prev.map(msg => 
        msg.tempId === tempId 
          ? { ...msg, retryCount: msg.retryCount + 1 }
          : msg
      )
    );
  }, []);

  const getRetryableMessages = useCallback(() => {
    return queue.filter(msg => msg.retryCount < MAX_RETRIES);
  }, [queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateRetryCount,
    getRetryableMessages,
    clearQueue,
    hasQueuedMessages: queue.length > 0
  };
};
