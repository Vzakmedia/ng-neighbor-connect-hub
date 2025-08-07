import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SafetyAlert, PanicAlert, EmergencyFilters } from '@/types/emergency';

// Create a hash function for comparing data
const createDataHash = (data: any[]): string => {
  return JSON.stringify(data.map(item => ({
    id: item.id,
    updated_at: item.updated_at,
    status: item.status
  }))).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString();
};

export const useEmergencyAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [panicAlerts, setPanicAlerts] = useState<PanicAlert[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Cache and comparison refs
  const alertsHashRef = useRef<string>('');
  const panicAlertsHashRef = useRef<string>('');
  const lastFetchTimeRef = useRef<number>(0);
  const profileCacheRef = useRef<{neighborhood: string; phone: string} | null>(null);
  
  // Debounce mechanism
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchAlerts = useCallback(async (filters: EmergencyFilters, forceRefresh = false) => {
    if (!user) return;
    
    // Debounce rapid calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    return new Promise<void>((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        // Rate limiting: don't fetch more than once every 5 seconds unless forced
        const now = Date.now();
        if (!forceRefresh && now - lastFetchTimeRef.current < 5000) {
          resolve();
          return;
        }
        lastFetchTimeRef.current = now;
        setLoading(true);
        try {
          // Use cached profile if available
          let currentUserProfile = profileCacheRef.current;
          
          if (!currentUserProfile) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('neighborhood, phone')
              .eq('user_id', user.id)
              .single();

            if (profileError) {
              console.error('Error fetching user profile:', profileError);
            } else if (profile) {
              profileCacheRef.current = profile;
              currentUserProfile = profile;
            }
          }

          let query = supabase
            .from('safety_alerts')
            .select(`
              *,
              profiles (full_name, avatar_url, neighborhood)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

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
            
            setLoading(false);
            resolve();
            return;
          }

          // Filter alerts by user's neighborhood if profile is available
          let filteredAlerts = data || [];
          if (currentUserProfile?.neighborhood) {
            console.log('Filtering alerts by neighborhood:', currentUserProfile.neighborhood);
            console.log('Raw alerts data:', data?.length, 'alerts');
            filteredAlerts = (data || []).filter((alert: any) => {
              if (!alert.profiles) {
                console.log('Alert without profile data:', alert.id);
                return true; // Include alerts without profile data
              }
              // Check if the alert creator's neighborhood matches the user's neighborhood
              const alertNeighborhood = alert.profiles.neighborhood;
              const matches = alertNeighborhood === currentUserProfile.neighborhood;
              console.log(`Alert ${alert.id} neighborhood check:`, 
                         `Alert: ${alertNeighborhood} vs User: ${currentUserProfile.neighborhood} = ${matches}`);
              return matches;
            });
            console.log('Filtered alerts:', filteredAlerts.length, 'alerts');
          } else {
            console.log('No user neighborhood - showing all alerts:', data?.length);
          }
          
          // Compare with previous data using hash
          const newHash = createDataHash(filteredAlerts);
          if (newHash !== alertsHashRef.current) {
            console.log('Safety alerts updated:', filteredAlerts.length, 'alerts');
            alertsHashRef.current = newHash;
            setAlerts(filteredAlerts as SafetyAlert[]);
          } else {
            console.log('Safety alerts unchanged, skipping UI update');
          }
          
        } catch (error: any) {
          console.error('Error fetching safety alerts:', error);
          
          // Handle network errors gracefully
          if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError' || !navigator.onLine) {
            toast({
              title: "Connection Issue",
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
          resolve();
        }
      }, 300); // 300ms debounce
    });
  }, [user, toast]);

  const fetchPanicAlerts = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Use same debouncing mechanism
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    return new Promise<void>((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          // Use cached profile
          let userProfile = profileCacheRef.current;
          if (!userProfile) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('phone, neighborhood')
              .eq('user_id', user.id)
              .single();

            if (profileError) {
              console.error('Error fetching user profile for panic alerts:', profileError);
            } else if (profile) {
              profileCacheRef.current = profile;
              userProfile = profile;
            }
          }

          // Get panic alerts created by user
          const { data: userPanicAlerts, error: userError } = await supabase
            .from('panic_alerts')
            .select('*')
            .eq('user_id', user.id)
            .limit(20);

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

            // Get panic alerts in user's neighborhood
            if (userProfile.neighborhood) {
              try {
                const { data: areaAlerts, error: areaError } = await supabase
                  .from('panic_alerts')
                  .select(`
                    *,
                    profiles (neighborhood, full_name, avatar_url)
                  `)
                  .neq('user_id', user.id)
                  .order('created_at', { ascending: false })
                  .limit(15);

                if (areaError) {
                  console.error('Error fetching area panic alerts:', areaError);
                } else {
                  areaPanicAlerts = (areaAlerts || []).filter((alert: any) => 
                    alert.profiles?.neighborhood === userProfile.neighborhood
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

          // Compare with previous data using hash
          const newHash = createDataHash(uniqueAlerts);
          if (newHash !== panicAlertsHashRef.current) {
            console.log('Panic alerts updated:', uniqueAlerts.length, 'alerts');
            panicAlertsHashRef.current = newHash;
            setPanicAlerts(uniqueAlerts as PanicAlert[]);
          } else {
            console.log('Panic alerts unchanged, skipping UI update');
          }

        } catch (error: any) {
          console.error('Error fetching panic alerts:', error);
          
          // Handle network errors gracefully
          if (error?.message?.includes('Failed to fetch') || error?.name === 'TypeError' || !navigator.onLine) {
            toast({
              title: "Connection Issue",
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
        } finally {
          resolve();
        }
      }, 300); // 300ms debounce
    });
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
    setAlerts(prev => {
      const newList = [newAlert, ...prev];
      const newHash = createDataHash(newList);
      alertsHashRef.current = newHash;
      return newList;
    });
  }, []);

  // Clear cache when user changes
  const clearCache = useCallback(() => {
    profileCacheRef.current = null;
    alertsHashRef.current = '';
    panicAlertsHashRef.current = '';
    lastFetchTimeRef.current = 0;
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
    setPanicAlerts,
    clearCache
  };
};