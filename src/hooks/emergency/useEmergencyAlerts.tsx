import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SafetyAlert, PanicAlert, EmergencyFilters } from '@/types/emergency';

export const useEmergencyAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [loading, setLoading] = useState(false); // Changed from true to prevent initial loading

  const fetchAlerts = useCallback(async (filters: EmergencyFilters) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Add a short delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get current user's profile for location filtering
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('city, state')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Continue without location filtering if profile fetch fails
      }

      let query = supabase
        .from('safety_alerts')
        .select(`
          *,
          profiles (full_name, avatar_url, city, state)
        `)
        .order('created_at', { ascending: false })
        .limit(50); // Add limit to improve performance

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity as any);
      }

      if (filters.type !== 'all') {
        query = query.eq('alert_type', filters.type as any);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching safety alerts:', error);
        
        // Check if it's a network error
        if (error.message?.includes('Failed to fetch')) {
          toast({
            title: "Connection Issue",
            description: "Unable to connect to the server. Please check your internet connection.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to load safety alerts",
            description: error.message || "Unknown error occurred",
            variant: "destructive",
          });
        }
        
        // Don't clear existing alerts on error, just stop loading
        setLoading(false);
        return;
      }

      // Filter alerts by user's city and state if profile is available
      let filteredAlerts = data || [];
      if (currentUserProfile?.city && currentUserProfile?.state) {
        filteredAlerts = (data || []).filter((alert: any) => {
          if (!alert.profiles) return true; // Include alerts without profile data
          return alert.profiles.city === currentUserProfile.city && 
                 alert.profiles.state === currentUserProfile.state;
        });
      }
      
      console.log('Safety alerts fetched and filtered:', filteredAlerts.length, 'alerts');
      setAlerts(filteredAlerts as SafetyAlert[] || []);
    } catch (error: any) {
      console.error('Error fetching safety alerts:', error);
      
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        toast({
          title: "Network Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to load safety alerts",
          description: "Unable to fetch the latest safety alerts. Please try refreshing.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchPanicAlerts = useCallback(async () => {
    if (!user) return;
    
    try {
      // Add a short delay to prevent rapid successive calls
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Get current user's profile to filter by location
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('phone, state, city')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile for panic alerts:', profileError);
        // Continue with limited functionality if profile fetch fails
      }

      // Get panic alerts created by user
      const { data: userPanicAlerts, error: userError } = await supabase
        .from('panic_alerts')
        .select('*')
        .eq('user_id', user.id)
        .limit(20); // Add limit for performance

      if (userError) {
        throw userError;
      }

      let contactPanicAlerts: any[] = [];
      let areaPanicAlerts: any[] = [];
      
      // Only fetch contact and area alerts if we have profile data
      if (userProfile) {
        // Get panic alerts where user is an emergency contact
        if (userProfile.phone) {
          try {
            const { data: emergencyContacts } = await supabase
              .from('emergency_contacts')
              .select('user_id')
              .eq('phone_number', userProfile.phone);

            if (emergencyContacts && emergencyContacts.length > 0) {
              const contactUserIds = emergencyContacts.map(ec => ec.user_id);
              
              const { data: contactAlerts, error: contactError } = await supabase
                .from('panic_alerts')
                .select('*')
                .in('user_id', contactUserIds)
                .limit(10);

              if (contactError) {
                console.error('Error fetching contact panic alerts:', contactError);
              } else {
                contactPanicAlerts = contactAlerts || [];
              }
            }
          } catch (contactError) {
            console.error('Error processing emergency contacts:', contactError);
          }
        }

        // Get panic alerts in user's area (same state)
        if (userProfile.state) {
          try {
            const { data: areaAlerts, error: areaError } = await supabase
              .from('panic_alerts')
              .select(`
                *,
                profiles (state, city, full_name, avatar_url)
              `)
              .neq('user_id', user.id) // Exclude user's own alerts
              .order('created_at', { ascending: false })
              .limit(15);

            if (areaError) {
              console.error('Error fetching area panic alerts:', areaError);
            } else {
              // Filter by state/city in the application
              areaPanicAlerts = (areaAlerts || []).filter((alert: any) => 
                alert.profiles?.state === userProfile.state ||
                alert.profiles?.city === userProfile.city
              );
            }
          } catch (areaError) {
            console.error('Error processing area panic alerts:', areaError);
          }
        }
      }

      // Combine and deduplicate alerts
      const allPanicAlerts = [...(userPanicAlerts || []), ...contactPanicAlerts, ...areaPanicAlerts];
      const uniqueAlerts = allPanicAlerts.filter((alert, index, self) => 
        index === self.findIndex(a => a.id === alert.id)
      );

      setPanicAlerts(uniqueAlerts as PanicAlert[]);
    } catch (error: any) {
      console.error('Error fetching panic alerts:', error);
      
      // Handle network errors gracefully
      if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
        toast({
          title: "Network Error",
          description: "Unable to load panic alerts. Please check your connection.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to load panic alerts", 
          description: "Unable to fetch panic alerts. Please try refreshing.",
          variant: "destructive"
        });
      }
    }
  }, [user, toast]);

  const updateAlertStatus = useCallback((alertId: string, newStatus: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: newStatus as any, updated_at: new Date().toISOString() }
          : alert
      )
    );

    toast({
      title: "Status Updated",
      description: `Alert status changed to ${newStatus.replace('_', ' ')}`,
    });
  }, [toast]);

  const updatePanicAlertStatus = useCallback((alertId: string, newStatus: string) => {
    setPanicAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              is_resolved: newStatus === 'resolved',
              resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
              updated_at: new Date().toISOString() 
            }
          : alert
      )
    );
  }, []);

  const addNewAlert = useCallback((newAlert: SafetyAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  return {
    alerts,
    panicAlerts,
    loading,
    fetchAlerts,
    fetchPanicAlerts,
    updateAlertStatus,
    updatePanicAlertStatus,
    addNewAlert,
    setAlerts,
    setPanicAlerts
  };
};