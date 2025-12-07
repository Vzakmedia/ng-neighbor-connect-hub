import { useState, useEffect, useCallback } from 'react';

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'offline_request_queue';
const MAX_RETRIES = 3;

const isNativePlatform = (): boolean => {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadQueue = async (): Promise<QueuedRequest[]> => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        const { value } = await Preferences.get({ key: QUEUE_KEY });
        return value ? JSON.parse(value) : [];
      } else {
        const value = localStorage.getItem(QUEUE_KEY);
        return value ? JSON.parse(value) : [];
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
      return [];
    }
  };

  const saveQueue = async (queue: QueuedRequest[]) => {
    try {
      if (isNativePlatform()) {
        const { Preferences } = await import('@capacitor/preferences');
        await Preferences.set({
          key: QUEUE_KEY,
          value: JSON.stringify(queue),
        });
      } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
      setPendingCount(queue.length);
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  };

  const addToQueue = useCallback(async (request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>) => {
    const queue = await loadQueue();
    const newRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };
    queue.push(newRequest);
    await saveQueue(queue);
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing || !isOnline) return;

    setIsProcessing(true);
    const queue = await loadQueue();
    const remainingQueue: QueuedRequest[] = [];

    for (const request of queue) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to process request:', error);
        
        if (request.retries < MAX_RETRIES) {
          remainingQueue.push({
            ...request,
            retries: request.retries + 1,
          });
        }
      }
    }

    await saveQueue(remainingQueue);
    setIsProcessing(false);
  }, [isOnline, isProcessing]);

  const clearQueue = useCallback(async () => {
    await saveQueue([]);
  }, []);

  useEffect(() => {
    if (!isNativePlatform()) {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    let listener: any;

    const setupNativeNetwork = async () => {
      try {
        const { Network } = await import('@capacitor/network');
        
        const status = await Network.getStatus();
        setIsOnline(status.connected);

        listener = await Network.addListener('networkStatusChange', (status) => {
          setIsOnline(status.connected);
          
          if (status.connected) {
            processQueue();
          }
        });
      } catch (error) {
        console.error('Failed to setup native network:', error);
        setIsOnline(navigator.onLine);
      }
    };

    setupNativeNetwork();
    loadQueue().then(queue => setPendingCount(queue.length));

    return () => {
      listener?.remove?.();
    };
  }, [processQueue]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      processQueue();
    }
  }, [isOnline, pendingCount, processQueue]);

  return {
    isOnline,
    pendingCount,
    isProcessing,
    addToQueue,
    processQueue,
    clearQueue,
  };
};
