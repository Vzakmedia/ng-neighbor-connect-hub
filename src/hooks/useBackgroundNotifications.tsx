import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { playNotification } from '@/utils/audioUtils';

interface BackgroundNotificationData {
  type: 'emergency' | 'normal' | 'notification';
  title: string;
  body: string;
  tag?: string;
  requireSound?: boolean;
}

class BackgroundNotificationManager {
  private static instance: BackgroundNotificationManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private isPageVisible: boolean = true;
  private pendingNotifications: BackgroundNotificationData[] = [];

  private constructor() {
    this.initializeVisibilityAPI();
  }

  static getInstance(): BackgroundNotificationManager {
    if (!BackgroundNotificationManager.instance) {
      BackgroundNotificationManager.instance = new BackgroundNotificationManager();
    }
    return BackgroundNotificationManager.instance;
  }

  private initializeVisibilityAPI() {
    // Monitor page visibility
    document.addEventListener('visibilitychange', () => {
      this.isPageVisible = !document.hidden;
      console.log('Page visibility changed:', this.isPageVisible ? 'visible' : 'hidden');
      
      // Process pending notifications when page becomes visible
      if (this.isPageVisible && this.pendingNotifications.length > 0) {
        this.processPendingNotifications();
      }
    });

    // Initial state
    this.isPageVisible = !document.hidden;
  }

  async initialize(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        console.log('Registering service worker...');
        
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully');

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message from service worker:', event.data);
        });

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker is ready');
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async showNotification(data: BackgroundNotificationData): Promise<void> {
    try {
      console.log('Background notification request:', data);

      // Always try to play sound if page is visible or if specifically requested
      if (this.isPageVisible || data.requireSound) {
        try {
          await playNotification(data.type);
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      }

      // Show browser notification if page is not visible or for emergency alerts
      if (!this.isPageVisible || data.type === 'emergency') {
        await this.showBrowserNotification(data);
      }

      // For emergency alerts, always show notification regardless of visibility
      if (data.type === 'emergency') {
        await this.showBrowserNotification(data);
      }

    } catch (error) {
      console.error('Error showing background notification:', error);
      // Add to pending notifications for retry
      this.pendingNotifications.push(data);
    }
  }

  private async showBrowserNotification(data: BackgroundNotificationData): Promise<void> {
    try {
      // Check notification permission
      if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      if (this.serviceWorkerRegistration) {
        // Use service worker to show notification
        if (this.serviceWorkerRegistration.active) {
          this.serviceWorkerRegistration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            ...data
          });
        }
      } else {
        // Fallback to direct notification
        new Notification(data.title, {
          body: data.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: false,
          requireInteraction: data.type === 'emergency',
          tag: data.tag || 'notification'
        });
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  private processPendingNotifications(): void {
    console.log('Processing pending notifications:', this.pendingNotifications.length);
    
    this.pendingNotifications.forEach(async (notification) => {
      try {
        await playNotification(notification.type);
      } catch (error) {
        console.error('Error playing pending notification sound:', error);
      }
    });
    
    this.pendingNotifications = [];
  }

  isVisible(): boolean {
    return this.isPageVisible;
  }
}

// Hook to use background notifications
export const useBackgroundNotifications = () => {
  const { user } = useAuth();
  const managerRef = useRef<BackgroundNotificationManager | null>(null);

  useEffect(() => {
    if (user && !managerRef.current) {
      managerRef.current = BackgroundNotificationManager.getInstance();
      managerRef.current.initialize();
    }
  }, [user]);

  const showBackgroundNotification = async (data: BackgroundNotificationData) => {
    if (managerRef.current) {
      await managerRef.current.showNotification(data);
    }
  };

  const isPageVisible = () => {
    return managerRef.current?.isVisible() ?? true;
  };

  return {
    showBackgroundNotification,
    isPageVisible
  };
};

export { BackgroundNotificationManager };
export type { BackgroundNotificationData };