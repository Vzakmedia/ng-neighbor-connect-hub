import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Clock, XCircle, Activity, Zap, Wifi, WifiOff } from 'lucide-react';

interface AlertDashboardProps {
  className?: string;
}

export const AlertDashboard: React.FC<AlertDashboardProps> = ({ className }) => {
  const { metrics, getQueueStatus, processQueue, isProcessing } = useAlertSystem();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Load initial metrics
    getQueueStatus();
    
    // Set up real-time subscription for queue updates
    const channel = supabase.channel('alert-queue-updates');
    
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'alert_queue' }, 
      () => {
        console.log('Alert queue updated, refreshing metrics');
        getQueueStatus();
      }
    );

    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'alert_analytics' }, 
      () => {
        console.log('Alert analytics updated, refreshing metrics');
        getQueueStatus();
      }
    );

    channel.subscribe((status) => {
      console.log('Alert dashboard subscription status:', status);
      setIsConnected(status === 'SUBSCRIBED');
    });
    
    // Set up auto-refresh every 30 seconds as fallback
    const interval = setInterval(() => {
      getQueueStatus();
    }, 30000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
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

  const handleCreateTestAlert = async () => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    try {
      // Create a test safety alert that will trigger the queue
      const { data, error } = await supabase
        .from('safety_alerts')
        .insert({
          user_id: user.id,
          title: 'Test Alert',
          description: 'This is a test alert for system verification',
          alert_type: 'other' as const,
          severity: 'medium' as const,
          status: 'active' as const,
          latitude: 39.7817,
          longitude: -89.6501,
          address: '123 Test Street, Springfield, IL',
          images: []
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Test alert created:', data);
      
      // Refresh metrics to show the new alert in queue
      await getQueueStatus();
    } catch (error) {
      console.error('Failed to create test alert:', error);
    }
  };

  const totalAlerts = metrics.processed + metrics.pending + metrics.failed;
  const successRate = totalAlerts > 0 ? (metrics.processed / totalAlerts) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold break-words">Alert System Dashboard</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Monitor and manage real-time alert processing</p>
          </div>
          
          {/* Connection Status - Mobile friendly */}
          <div className="flex items-center gap-2 sm:hidden">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Real-time Connected' : 'Offline Mode'}
            </span>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Connection Status - Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Real-time Connected' : 'Offline Mode'}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              <span className="xs:hidden">Refresh</span>
            </Button>
            <Button 
              onClick={handleProcessQueue}
              disabled={isProcessing}
              size="sm"
              className="flex-1 sm:flex-initial"
            >
              <Zap className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Process Queue</span>
              <span className="xs:hidden">Process</span>
            </Button>
          </div>
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="queue" className="text-xs sm:text-sm">Queue</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
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
                  <div className="space-y-4">
                    <Button 
                      onClick={handleProcessQueue} 
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : 'Process Next Alert'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleCreateTestAlert}
                      className="w-full"
                    >
                      Create Test Alert
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