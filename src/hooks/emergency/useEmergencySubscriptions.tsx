import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SafetyAlert, EmergencyFilters } from '@/types/emergency';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const userNeighborhoodRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch and cache the user's neighborhood for filtering
    supabase
      .from('profiles')
      .select('neighborhood')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        userNeighborhoodRef.current = data?.neighborhood ?? null;
      });
  }, [user]);

  useEffect(() => {
    // Subscribe to safety alert events
    const unsubscribe = onSafetyAlert(async (payload) => {
      if (payload.eventType === 'INSERT') {
        try {
          // Fetch the complete alert with profile data
          const { data } = await supabase
            .from('safety_alerts')
            .select(`
              *,
              profiles (full_name, avatar_url, city, state, neighborhood)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            // Client-side neighborhood guard: only forward if neighborhoods match
            // or if neighborhood data is unavailable on the alert
            const alertNeighborhood = (data as any).profiles?.neighborhood;
            const userNeighborhood = userNeighborhoodRef.current;
            if (userNeighborhood && alertNeighborhood && alertNeighborhood !== userNeighborhood) {
              return;
            }

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
        onAlertUpdate(payload.new.id, payload.new as Partial<SafetyAlert>);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onSafetyAlert, onNewAlert, onAlertUpdate, toast]);
};