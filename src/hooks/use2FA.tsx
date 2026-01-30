import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface User2FA {
  id: string;
  user_id: string;
  is_enabled: boolean;
  enabled_at: string | null;
  last_used_at: string | null;
}

export const use2FA = () => {
  const { user } = useAuth();
  const [user2FA, setUser2FA] = useState<User2FA | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetch2FAStatus();
    } else {
      setUser2FA(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetch2FAStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_2fa')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setUser2FA(data || null);
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch 2FA status');
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    if (user) {
      fetch2FAStatus();
    }
  };

  return {
    user2FA,
    isLoading,
    error,
    refresh,
    is2FAEnabled: user2FA?.is_enabled || false,
  };
};