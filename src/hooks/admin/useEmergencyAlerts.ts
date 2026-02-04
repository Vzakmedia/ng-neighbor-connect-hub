import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmergencyAlert {
    id: string;
    user_id: string;
    alert_type: string;
    status: 'active' | 'investigating' | 'resolved' | 'false_alarm';
    location?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    created_at: string;
    updated_at: string;
    profiles?: {
        full_name: string;
        phone_number?: string;
    };
}

interface AlertFilters {
    type?: string;
    status?: string;
    search?: string;
}

export const useEmergencyAlerts = () => {
    const { toast } = useToast();
    const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAlerts = useCallback(async (filters?: AlertFilters) => {
        try {
            setLoading(true);

            let query = supabase
                .from('safety_alerts')
                .select(`
          *,
          profiles (
            full_name,
            phone_number
          )
        `)
                .order('created_at', { ascending: false });

            if (filters?.type && filters.type !== 'all') {
                query = query.eq('alert_type', filters.type);
            }

            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }

            if (filters?.search) {
                query = query.or(`description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            setAlerts(data || []);
        } catch (error) {
            console.error('Error fetching emergency alerts:', error);
            toast({
                title: 'Error',
                description: 'Failed to load emergency alerts',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const updateAlertStatus = useCallback(async (
        alertId: string,
        newStatus: 'active' | 'investigating' | 'resolved' | 'false_alarm'
    ) => {
        try {
            // Optimistically update local state
            setAlerts(prev => prev.map(alert =>
                alert.id === alertId ? { ...alert, status: newStatus } : alert
            ));

            // Find corresponding panic_alert
            const alert = alerts.find(a => a.id === alertId);
            if (alert) {
                const { data: panicAlerts } = await supabase
                    .from('panic_alerts')
                    .select('id')
                    .eq('user_id', alert.user_id)
                    .gte('created_at', new Date(new Date(alert.created_at).getTime() - 60000).toISOString())
                    .lte('created_at', new Date(new Date(alert.created_at).getTime() + 60000).toISOString())
                    .limit(1);

                if (panicAlerts && panicAlerts.length > 0) {
                    const panicAlertId = panicAlerts[0].id;

                    const { error } = await supabase.functions.invoke('update-panic-alert-status', {
                        body: {
                            alertId: panicAlertId,
                            status: newStatus,
                        },
                    });

                    if (error) throw error;
                }
            }

            // Update safety_alert directly
            const { error: safetyError } = await supabase
                .from('safety_alerts')
                .update({ status: newStatus })
                .eq('id', alertId);

            if (safetyError) throw safetyError;

            toast({
                title: 'Status Updated',
                description: `Alert status changed to ${newStatus}`,
            });

            await fetchAlerts();
            return true;
        } catch (error) {
            console.error('Error updating alert status:', error);

            // Revert optimistic update
            await fetchAlerts();

            toast({
                title: 'Error',
                description: 'Failed to update alert status',
                variant: 'destructive',
            });
            return false;
        }
    }, [alerts, toast, fetchAlerts]);

    const resolveAlert = useCallback(async (alertId: string) => {
        return updateAlertStatus(alertId, 'resolved');
    }, [updateAlertStatus]);

    const markAsInvestigating = useCallback(async (alertId: string) => {
        return updateAlertStatus(alertId, 'investigating');
    }, [updateAlertStatus]);

    const markAsFalseAlarm = useCallback(async (alertId: string) => {
        return updateAlertStatus(alertId, 'false_alarm');
    }, [updateAlertStatus]);

    const getAlertTypeLabel = useCallback((alert: EmergencyAlert) => {
        const typeLabels: Record<string, string> = {
            'fire': '🔥 Fire Emergency',
            'medical': '🚑 Medical Emergency',
            'crime': '🚨 Crime/Security',
            'accident': '🚗 Accident',
            'natural_disaster': '🌪️ Natural Disaster',
            'other': '⚠️ Other Emergency',
        };
        return typeLabels[alert.alert_type] || '⚠️ Emergency Alert';
    }, []);

    const formatLocation = useCallback((alert: EmergencyAlert) => {
        if (alert.location) {
            return alert.location;
        }
        if (alert.latitude && alert.longitude) {
            return `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`;
        }
        return 'Location not available';
    }, []);

    return {
        alerts,
        loading,
        fetchAlerts,
        updateAlertStatus,
        resolveAlert,
        markAsInvestigating,
        markAsFalseAlarm,
        getAlertTypeLabel,
        formatLocation,
    };
};
