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
    // Set up safe real-time subscriptions
    const alertsSubscription = createSafeSubscription(
      (channel) => channel
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'safety_alerts' },
          async (payload) => {
            console.log('New safety alert:', payload);
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
          }
        )
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'safety_alerts' },
          (payload) => {
            console.log('Alert updated:', payload);
            onAlertUpdate(payload.new.id, payload.new as Partial<SafetyAlert>);
          }
        ),
      {
        channelName: 'safety_alerts_updates',
        onError: () => {
          onRefreshNeeded();
        },
        pollInterval: 30000,
        debugName: 'EmergencySubscriptions'
      }
    );

    return () => {
      alertsSubscription?.unsubscribe();
    };
  }, [filters, onNewAlert, onAlertUpdate, onRefreshNeeded, toast]);
};