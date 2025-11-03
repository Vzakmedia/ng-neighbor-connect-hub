import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';

interface PerformanceMetrics {
  appLaunchTime?: number;
  firstRenderTime?: number;
  apiLatency: Map<string, number[]>;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    apiLatency: new Map(),
  };
  private isNative = Capacitor.isNativePlatform();
  private initialized = false;

  initialize(dsn?: string) {
    if (this.initialized) return;

    // Only initialize Sentry in production on native
    if (this.isNative && import.meta.env.PROD && dsn) {
      Sentry.init({
        dsn: dsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        tracesSampleRate: 0.1, // 10% of transactions
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        environment: import.meta.env.MODE,
        enabled: import.meta.env.PROD,
      });

      console.log('Performance monitoring initialized');
    }

    this.initialized = true;
    this.trackAppLaunch();
  }

  private trackAppLaunch() {
    if (typeof window !== 'undefined' && window.performance) {
      const navigationTiming = window.performance.timing;
      const appLaunchTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart;
      this.metrics.appLaunchTime = appLaunchTime;

      // Track first render
      const firstRenderTime = navigationTiming.domContentLoadedEventEnd - navigationTiming.navigationStart;
      this.metrics.firstRenderTime = firstRenderTime;

      console.log('App Performance:', {
        appLaunchTime: `${appLaunchTime}ms`,
        firstRenderTime: `${firstRenderTime}ms`,
      });

      // Send to Sentry if available (metrics API may not be available in all Sentry versions)
      if (this.initialized && Sentry.isInitialized()) {
        Sentry.captureMessage(`App launch time: ${appLaunchTime}ms`, {
          level: 'info',
          tags: { platform: this.isNative ? 'native' : 'web', metric: 'launch_time' },
        });
      }
    }
  }

  trackApiCall(endpoint: string, duration: number) {
    const latencies = this.metrics.apiLatency.get(endpoint) || [];
    latencies.push(duration);
    
    // Keep only last 100 calls per endpoint
    if (latencies.length > 100) {
      latencies.shift();
    }
    
    this.metrics.apiLatency.set(endpoint, latencies);

    // Send to Sentry (using breadcrumb for API timing)
    if (this.initialized && Sentry.isInitialized()) {
      Sentry.addBreadcrumb({
        category: 'api',
        message: `API call to ${endpoint}`,
        level: 'info',
        data: {
          duration,
          endpoint,
          platform: this.isNative ? 'native' : 'web',
        },
      });
    }
  }

  trackError(error: Error, context?: Record<string, any>) {
    console.error('Tracked error:', error, context);

    if (this.initialized && Sentry.isInitialized()) {
      Sentry.captureException(error, {
        extra: context,
        tags: {
          platform: this.isNative ? 'native' : 'web',
        },
      });
    }
  }

  trackMemoryUsage() {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
      this.metrics.memoryUsage = usedMemory;

      if (this.initialized && Sentry.isInitialized()) {
        Sentry.addBreadcrumb({
          category: 'performance',
          message: 'Memory usage check',
          level: 'info',
          data: {
            memoryUsage: usedMemory,
            platform: this.isNative ? 'native' : 'web',
          },
        });
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getAverageLatency(endpoint: string): number {
    const latencies = this.metrics.apiLatency.get(endpoint);
    if (!latencies || latencies.length === 0) return 0;
    
    const sum = latencies.reduce((a, b) => a + b, 0);
    return sum / latencies.length;
  }

  getAllAverageLatencies(): Record<string, number> {
    const result: Record<string, number> = {};
    this.metrics.apiLatency.forEach((latencies, endpoint) => {
      if (latencies.length > 0) {
        const sum = latencies.reduce((a, b) => a + b, 0);
        result[endpoint] = sum / latencies.length;
      }
    });
    return result;
  }

  setUser(userId: string, email?: string) {
    if (this.initialized && Sentry.isInitialized()) {
      Sentry.setUser({ id: userId, email });
    }
  }

  clearUser() {
    if (this.initialized && Sentry.isInitialized()) {
      Sentry.setUser(null);
    }
  }

  // Start monitoring memory usage every 30 seconds
  startMemoryMonitoring() {
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper to wrap API calls with performance tracking
export const trackApiCall = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    performanceMonitor.trackApiCall(endpoint, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.trackApiCall(endpoint, duration);
    performanceMonitor.trackError(error as Error, { endpoint });
    throw error;
  }
};
