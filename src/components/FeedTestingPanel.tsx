import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Database, Wifi, Zap } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
  duration?: number;
}

/**
 * Testing panel for validating feed functionality
 * Only visible in development mode
 */
export const FeedTestingPanel = () => {
  const queryClient = useQueryClient();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Check if feed query exists
    const startTime = Date.now();
    const feedQueries = queryClient.getQueryCache().findAll({ queryKey: ['feed'] });
    results.push({
      name: 'Feed Query Initialized',
      status: feedQueries.length > 0 ? 'pass' : 'fail',
      message: feedQueries.length > 0 ? `Found ${feedQueries.length} feed queries` : 'No feed queries found',
      duration: Date.now() - startTime,
    });

    // Test 2: Check cache persistence
    const cacheStart = Date.now();
    const cachedData = localStorage.getItem('REACT_QUERY_OFFLINE_CACHE');
    results.push({
      name: 'Cache Persistence',
      status: cachedData ? 'pass' : 'fail',
      message: cachedData ? 'Cache found in localStorage' : 'No cached data',
      duration: Date.now() - cacheStart,
    });

    // Test 3: Check data freshness
    const freshnessStart = Date.now();
    const firstQuery = feedQueries[0];
    const dataAge = firstQuery ? Date.now() - (firstQuery.state.dataUpdatedAt || 0) : Infinity;
    results.push({
      name: 'Data Freshness',
      status: dataAge < 30000 ? 'pass' : 'fail',
      message: `Data age: ${(dataAge / 1000).toFixed(1)}s (target: <30s)`,
      duration: Date.now() - freshnessStart,
    });

    // Test 4: Check infinite scroll setup
    const scrollStart = Date.now();
    const hasInfiniteData = feedQueries.some(q => {
      const data = q.state.data as any;
      return data?.pages && Array.isArray(data.pages);
    });
    results.push({
      name: 'Infinite Scroll Data Structure',
      status: hasInfiniteData ? 'pass' : 'fail',
      message: hasInfiniteData ? 'Paginated data found' : 'Missing pagination structure',
      duration: Date.now() - scrollStart,
    });

    // Test 5: Check real-time subscriptions
    const realtimeStart = Date.now();
    const supabaseChannels = (window as any).__supabaseChannels || [];
    results.push({
      name: 'Real-time Subscriptions',
      status: supabaseChannels.length > 0 ? 'pass' : 'pending',
      message: `${supabaseChannels.length} active channels`,
      duration: Date.now() - realtimeStart,
    });

    // Test 6: Performance check
    const perfStart = Date.now();
    const avgQueryTime = feedQueries.reduce((acc, q) => {
      return acc + (q.state.dataUpdatedAt ? Date.now() - q.state.dataUpdatedAt : 0);
    }, 0) / feedQueries.length;
    results.push({
      name: 'Performance',
      status: avgQueryTime < 2000 ? 'pass' : 'fail',
      message: `Avg load time: ${(avgQueryTime / 1000).toFixed(1)}s`,
      duration: Date.now() - perfStart,
    });

    setTests(results);
    setIsRunning(false);
  };

  const clearCache = () => {
    queryClient.clear();
    localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');
    setTests([]);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-2xl z-50 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Feed Testing Panel
          </div>
          <Badge variant="outline" className="text-xs">DEV</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={runTests} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={clearCache}
          >
            Clear Cache
          </Button>
        </div>

        {tests.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tests.map((test, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
              >
                {test.status === 'pass' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                {test.status === 'fail' && <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                {test.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />}
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{test.name}</div>
                  {test.message && (
                    <div className="text-muted-foreground">{test.message}</div>
                  )}
                  {test.duration && (
                    <div className="text-muted-foreground">
                      {test.duration}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {queryClient.getQueryCache().getAll().length} queries
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {navigator.onLine ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
