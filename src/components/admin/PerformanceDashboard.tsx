import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { performanceMonitor } from '@/utils/performanceMonitoring';
import { Activity, Zap, Database, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());
  const [latencies, setLatencies] = useState<Record<string, number>>({});

  useEffect(() => {
    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
      setLatencies(performanceMonitor.getAllAverageLatencies());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return 'text-green-500';
    if (latency < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLatencyProgress = (latency: number) => {
    // Scale: 0-1000ms = 0-100%
    return Math.min((latency / 1000) * 100, 100);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Launch Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.appLaunchTime)}</div>
            <p className="text-xs text-muted-foreground">
              Time from start to interactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Render</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.firstRenderTime)}</div>
            <p className="text-xs text-muted-foreground">
              Time to first content paint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(1)} MB` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current heap usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(latencies).length}</div>
            <p className="text-xs text-muted-foreground">
              Tracked endpoints
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Latency</CardTitle>
          <CardDescription>
            Average response times for API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(latencies).length === 0 ? (
              <p className="text-sm text-muted-foreground">No API calls tracked yet</p>
            ) : (
              Object.entries(latencies).map(([endpoint, latency]) => (
                <div key={endpoint} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-xs">
                      {endpoint}
                    </span>
                    <span className={`text-sm font-mono ${getLatencyColor(latency)}`}>
                      {formatTime(latency)}
                    </span>
                  </div>
                  <Progress value={getLatencyProgress(latency)} className="h-2" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
