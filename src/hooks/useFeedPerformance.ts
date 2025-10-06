import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  timeToFirstPost: number;
  totalLoadTime: number;
  cacheHitRate: number;
  averageScrollToNextPage: number;
}

/**
 * Monitor feed performance metrics
 */
export function useFeedPerformance() {
  const queryClient = useQueryClient();
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  const loadStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const feedQueries = queryClient.getQueryCache().findAll({ queryKey: ['feed'] });
    
    if (feedQueries.length > 0) {
      const firstQuery = feedQueries[0];
      const state = firstQuery.state;

      // Track time to first post
      if (state.data && !metricsRef.current.timeToFirstPost) {
        const timeToFirstPost = Date.now() - loadStartTime.current;
        metricsRef.current.timeToFirstPost = timeToFirstPost;
        
        console.log(`📊 Feed Performance - Time to First Post: ${timeToFirstPost}ms`);
        
        // Log to analytics
        if ((window as any).analytics) {
          (window as any).analytics.track('feed_performance', {
            metric: 'time_to_first_post',
            value: timeToFirstPost,
            cached: state.dataUpdateCount === 0,
          });
        }
      }

      // Track cache hit rate
      const cacheHits = feedQueries.filter(q => q.state.dataUpdateCount === 0).length;
      const cacheHitRate = (cacheHits / feedQueries.length) * 100;
      metricsRef.current.cacheHitRate = cacheHitRate;
    }
  }, [queryClient]);

  // Log metrics in dev mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      const interval = setInterval(() => {
        const feedQueries = queryClient.getQueryCache().findAll({ queryKey: ['feed'] });
        
        console.group('📊 Feed Performance Metrics');
        console.log('Time to First Post:', metricsRef.current.timeToFirstPost, 'ms');
        console.log('Cache Hit Rate:', metricsRef.current.cacheHitRate?.toFixed(2), '%');
        console.log('Active Feed Queries:', feedQueries.length);
        console.log('Query States:', feedQueries.map(q => ({
          key: q.queryKey,
          status: q.state.status,
          dataUpdates: q.state.dataUpdateCount,
          fetchStatus: q.state.fetchStatus,
        })));
        console.groupEnd();
      }, 30000); // Log every 30 seconds

      return () => clearInterval(interval);
    }
  }, [queryClient]);

  return metricsRef.current;
}

/**
 * Monitor scroll performance for infinite scroll
 */
export function useScrollPerformance() {
  const scrollTimeRef = useRef<number>(0);
  const pageLoadTimesRef = useRef<number[]>([]);

  const trackScrollToNextPage = () => {
    const scrollTime = Date.now() - scrollTimeRef.current;
    pageLoadTimesRef.current.push(scrollTime);
    
    const avgScrollTime = pageLoadTimesRef.current.reduce((a, b) => a + b, 0) / pageLoadTimesRef.current.length;
    
    console.log(`📜 Scroll Performance - Page Load: ${scrollTime}ms (Avg: ${avgScrollTime.toFixed(0)}ms)`);
    
    scrollTimeRef.current = Date.now();
  };

  return { trackScrollToNextPage };
}

/**
 * Monitor network requests for feed
 */
export function useNetworkMonitoring() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url] = args;
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        if (typeof url === 'string' && url.includes('get_feed')) {
          console.log(`🌐 Network - Feed RPC: ${duration}ms`, {
            status: response.status,
            cached: response.headers.get('x-cache') === 'HIT',
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Network Error - ${url}: ${duration}ms`, error);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);
}
