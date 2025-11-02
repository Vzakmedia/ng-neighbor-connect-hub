import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SafetyAlert, EmergencyFilters } from '@/types/emergency';
import { useRealtimeContext } from '@/contexts/RealtimeContext';

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
  const { onSafetyAlert } = useRealtimeContext();

  useEffect(() => {
    console.log('[EmergencySubscriptions] Using unified real-time subscriptions');
    
    // Subscribe to safety alert events
    const unsubscribe = onSafetyAlert(async (payload) => {
      if (payload.eventType === 'INSERT') {
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
      } else if (payload.eventType === 'UPDATE') {
        console.log('Alert updated:', payload.new.id);
        onAlertUpdate(payload.new.id, payload.new as Partial<SafetyAlert>);
      }
    });

    return () => {
      console.log('[EmergencySubscriptions] Cleaning up subscription');
      unsubscribe();
    };
  }, [onSafetyAlert, onNewAlert, onAlertUpdate, toast]);
};