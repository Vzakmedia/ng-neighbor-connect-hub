import { useState, useEffect, useCallback, useRef } from 'react';
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
  // Track whether we have ever completed a role fetch so that subsequent
  // re-checks (e.g. after token refresh) don't re-show the loading spinner.
  const hasFetchedOnce = useRef(false);

  const userId = user?.id;

  const checkAdminStatus = useCallback(async () => {
    if (!userId) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setRole(null);
      setHas2FAEnabled(false);
      setIsLoading(false);
      hasFetchedOnce.current = false;
      return;
    }

    try {
      // Only show the blocking spinner on the very first fetch.
      // Subsequent silent re-checks keep the existing role visible.
      if (!hasFetchedOnce.current) {
        setIsLoading(true);
      }
      setError(null);

      // Check role using security definer function
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      const { data: hasSuperAdminRole } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'super_admin'
      });

      // Get actual role from user_roles table
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

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
        .eq('user_id', userId)
        .maybeSingle();

      setHas2FAEnabled(twoFAData?.is_enabled || false);

    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
      // Don't clear the role on a re-check error — keep the last known value
      if (!hasFetchedOnce.current) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setRole(null);
      }
    } finally {
      setIsLoading(false);
      hasFetchedOnce.current = true;
    }
  }, [userId]);

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
