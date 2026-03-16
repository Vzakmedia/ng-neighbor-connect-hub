import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'manager' | 'support' | 'staff' | 'user' | null;

interface AdminStatus {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  isLoading: boolean;
  error: string | null;
  has2FAEnabled: boolean;
  refresh: () => Promise<void>;
}

export const useAdminStatus = (): AdminStatus => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [has2FAEnabled, setHas2FAEnabled] = useState(false);

  const checkAdminStatus = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setRole(null);
      setHas2FAEnabled(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check role using security definer function
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      const { data: hasSuperAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      // Get actual role from user_roles table
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      const rolePriority: AdminRole[] = ['super_admin', 'admin', 'moderator', 'manager', 'support', 'staff', 'user'];
      const matchedRole = rolePriority.find(priority =>
        (roleRows || []).some(row => row.role === priority)
      );
      const userRole = matchedRole || 'user';
      
      setRole(userRole);
      setIsAdmin(hasAdminRole || hasSuperAdminRole || userRole === 'admin' || userRole === 'super_admin');
      setIsSuperAdmin(hasSuperAdminRole || userRole === 'super_admin');

      // Check 2FA status
      const { data: twoFAData } = await supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      setHas2FAEnabled(twoFAData?.is_enabled || false);

    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return {
    isAdmin,
    isSuperAdmin,
    role,
    isLoading,
    error,
    has2FAEnabled,
    refresh: checkAdminStatus
  };
};
