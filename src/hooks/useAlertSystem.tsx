import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AlertSystemConfig {
  enableRealTime: boolean;
  channels: string[];
  cacheTTL: number;
}

interface AlertMetrics {
  processed: number;
  delivered: number;
  failed: number;
  pending: number;
}

export const useAlertSystem = (config: AlertSystemConfig = {
  enableRealTime: true,
  channels: ['websocket'],
  cacheTTL: 300
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<AlertMetrics>({
    processed: 0,
    delivered: 0,
    failed: 0,
    pending: 0
  });

  // Real-time subscription for alert notifications
  useEffect(() => {
    if (!user || !config.enableRealTime) return;

    const channel = supabase.channel(`user_${user.id}`);
    
    channel
      .on('broadcast', { event: 'alert_notification' }, (payload) => {
        const alertData = payload.payload;
        
        // Show toast notification
        toast({
          title: alertData.title || 'Safety Alert',
          description: alertData.description,
          variant: alertData.severity === 'critical' ? 'destructive' : 'default',
        });

        // Track view metric
        trackAlertMetric(alertData.alertId, 'view');
      })
      .on('broadcast', { event: 'new_alert' }, (payload) => {
        const alertData = payload.payload;
        
        toast({
          title: `New ${alertData.severity} Alert`,
          description: `Alert from ${alertData.creator}`,
          variant: alertData.severity === 'critical' ? 'destructive' : 'default',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, config.enableRealTime, toast]);

  // Process alert through the queue system
  const processAlert = useCallback(async (
    alertId: string, 
    priority: number = 3,
    targetingRules: any[] = []
  ) => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('alert-processor', {
        body: {
          alertId,
          priority,
          targetingRules
        }
      });

      if (error) throw error;

      console.log('Alert processed successfully:', data);
      
      toast({
        title: "Alert Processed",
        description: `Alert sent to ${data.targetUsers} users`,
      });

      return data;
    } catch (error) {
      console.error('Error processing alert:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process alert",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, toast]);

  // Send notifications via multiple channels
  const deliverNotification = useCallback(async (
    alertId: string,
    userId: string,
    channels: string[] = config.channels
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('notification-delivery', {
        body: {
          alertId,
          userId,
          channels
        }
      });

      if (error) throw error;

      console.log('Notification delivered:', data);
      return data;
    } catch (error) {
      console.error('Error delivering notification:', error);
      throw error;
    }
  }, [config.channels]);

  // Track alert metrics
  const trackAlertMetric = useCallback(async (
    alertId: string,
    metricType: string,
    metadata: any = {}
  ) => {
    try {
      await supabase.rpc('track_alert_metric', {
        _alert_id: alertId,
        _metric_type: metricType,
        _user_id: user?.id,
        _metadata: metadata
      });
    } catch (error) {
      console.error('Error tracking metric:', error);
    }
  }, [user]);

  // Get cached alert data
  const getCachedAlert = useCallback(async (cacheKey: string) => {
    try {
      const { data } = await supabase.rpc('get_cached_alerts', {
        _cache_key: cacheKey
      });
      return data;
    } catch (error) {
      console.error('Error getting cached alert:', error);
      return null;
    }
  }, []);

  // Set alert cache
  const setCachedAlert = useCallback(async (
    cacheKey: string,
    data: any,
    ttl: number = config.cacheTTL
  ) => {
    try {
      await supabase.rpc('set_alert_cache', {
        _cache_key: cacheKey,
        _cache_data: data,
        _ttl_seconds: ttl
      });
    } catch (error) {
      console.error('Error setting cached alert:', error);
    }
  }, [config.cacheTTL]);

  // Get alert queue status
  const getQueueStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alert_queue')
        .select('status')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const statusCounts = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setMetrics({
        processed: statusCounts.completed || 0,
        pending: statusCounts.pending || 0,
        failed: statusCounts.failed || 0,
        delivered: statusCounts.completed || 0
      });

      return statusCounts;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return {};
    }
  }, []);

  // Process next item in queue (admin function)
  const processQueue = useCallback(async () => {
    try {
      await supabase.rpc('process_alert_queue');
      await getQueueStatus(); // Refresh metrics
    } catch (error) {
      console.error('Error processing queue:', error);
      throw error;
    }
  }, [getQueueStatus]);

  return {
    // State
    isProcessing,
    metrics,
    
    // Actions
    processAlert,
    deliverNotification,
    trackAlertMetric,
    
    // Cache operations
    getCachedAlert,
    setCachedAlert,
    
    // Queue management
    getQueueStatus,
    processQueue
  };
};