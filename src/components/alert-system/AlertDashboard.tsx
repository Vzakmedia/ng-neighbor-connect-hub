import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { AlertCircle, CheckCircle, Clock, XCircle, Activity, Zap } from 'lucide-react';

interface AlertDashboardProps {
  className?: string;
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ className }) => {
  const { metrics, getQueueStatus, processQueue, isProcessing } = useAlertSystem();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load initial metrics
    getQueueStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      getQueueStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [getQueueStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getQueueStatus();
    } finally {
      setRefreshing(false);
    }
  };

  const handleProcessQueue = async () => {
    try {
      await processQueue();
    } catch (error) {
      console.error('Failed to process queue:', error);
    }
  };

  const totalAlerts = metrics.processed + metrics.pending + metrics.failed;
  const successRate = totalAlerts > 0 ? (metrics.processed / totalAlerts) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Alert System Dashboard</h2>
          <p className="text-muted-foreground">Monitor and manage real-time alert processing</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={handleProcessQueue}
            disabled={isProcessing}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Process Queue
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold text-green-600">{metrics.processed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{metrics.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Alert processing efficiency and success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">{successRate.toFixed(1)}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{totalAlerts}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {metrics.pending > 0 && (
                    <Badge variant="secondary">{metrics.pending} queued</Badge>
                  )}
                  {metrics.pending === 0 && (
                    <Badge variant="default">System Idle</Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Queue Status</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Alert Processing</span>
                  <Badge variant={isProcessing ? "default" : "secondary"}>
                    {isProcessing ? "Active" : "Idle"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Real-time Delivery</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cache System</span>
                  <Badge variant="default">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Management</CardTitle>
              <CardDescription>Monitor and control alert processing queue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Queue Processing</h3>
                  <p className="text-muted-foreground mb-4">
                    Alerts are processed automatically based on priority
                  </p>
                  <Button onClick={handleProcessQueue} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Process Next Alert'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed insights into alert system performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  Detailed analytics will be available as the system processes more alerts
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure alert processing and delivery settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Configuration options will be available for system administrators
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};