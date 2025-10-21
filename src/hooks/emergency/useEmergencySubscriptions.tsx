import { useEffect } from 'react';
import { createSafeSubscription } from '@/utils/realtimeUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SafetyAlert, EmergencyFilters } from '@/types/emergency';

interface UseEmergencySubscriptionsProps {
  onNewAlert: (alert: SafetyAlert) => void;
  onAlertUpdate: (alertId: string, updates: Partial<SafetyAlert>) => void;
  onRefreshNeeded: () => void;
  filters: EmergencyFilters;
}

export const useEmergencySubscriptions = ({
  onNewAlert,
  onAlertUpdate,
  onRefreshNeeded,
  filters
}: UseEmergencySubscriptionsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    console.log('EmergencySubscriptions: Setting up real-time subscriptions');
    
    // Set up safe real-time subscriptions
    const alertsSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'safety_alerts' },
          async (payload) => {
            console.log('New safety alert received:', payload.new.id);
            try {
              // Fetch the complete alert with profile data
              const { data } = await supabase
                .from('safety_alerts')
                .select(`
                  *,
                  profiles (full_name, avatar_url, city, state)
                `)
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                onNewAlert(data as SafetyAlert);
                toast({
                  title: "New Safety Alert",
                  description: `${data.title} - ${data.severity} severity`,
                });
              }
            } catch (error) {
              console.error('Error fetching new alert details:', error);
            }
          }
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'safety_alerts' },
          (payload) => {
            console.log('Alert updated:', payload.new.id);
            onAlertUpdate(payload.new.id, payload.new as Partial<SafetyAlert>);
          }
        ),
      {
        channelName: 'safety_alerts_updates',
        onError: () => {
          // Silently handle the fallback without unnecessary error logging
        },
        pollInterval: 30000, // 30 seconds for more responsive updates
        debugName: 'EmergencySubscriptions'
      }
    );

    return () => {
      console.log('EmergencySubscriptions: Cleaning up subscriptions');
      alertsSubscription?.unsubscribe();
    };
  }, [onNewAlert, onAlertUpdate, toast]); // Removed filters dependency to prevent re-subscription
};