const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

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
  private initialized = false;

  initialize(dsn?: string) {
    if (this.initialized) return;

    console.log('Performance monitoring initialized');
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
  }

  trackError(error: Error, context?: Record<string, any>) {
    console.error('Tracked error:', error, context);
  }

  trackMemoryUsage() {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMemory = memory.usedJSHeapSize / 1048576; // Convert to MB
      this.metrics.memoryUsage = usedMemory;
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
    console.log('User set for performance monitoring:', userId);
  }

  clearUser() {
    console.log('User cleared from performance monitoring');
  }

  isNative() {
    return isNativePlatform();
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
