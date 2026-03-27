import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { AdminRole } from '@/hooks/useAdminStatus';

interface AdminStatusContextValue {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: AdminRole;
  isLoading: boolean;
  error: string | null;
  has2FAEnabled: boolean;
  refresh: () => Promise<void>;
}

const AdminStatusContext = createContext<AdminStatusContextValue>({
  isAdmin: false,
  isSuperAdmin: false,
  role: null,
  isLoading: true,
  error: null,
  has2FAEnabled: false,
  refresh: async () => {},
});

/**
 * Fetches the user's role ONCE per session and holds it in context.
 * All ProtectedRoute instances and useAdminStatus callers share this single
 * value — navigation between pages never triggers a re-fetch or a spinner.
 */
export function AdminStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [has2FAEnabled, setHas2FAEnabled] = useState(false);
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
      if (!hasFetchedOnce.current) {
        setIsLoading(true);
      }
      setError(null);

      const [{ data: hasAdminRole }, { data: hasSuperAdminRole }, { data: roleRows, error: roleError }] =
        await Promise.all([
          supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: userId, _role: 'super_admin' }),
          supabase.from('user_roles').select('role').eq('user_id', userId),
        ]);

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      const rolePriority: AdminRole[] = ['super_admin', 'admin', 'moderator', 'manager', 'support', 'staff', 'user'];
      const matchedRole = rolePriority.find(priority =>
        (roleRows || []).some((row: { role: string }) => row.role === priority)
      );
      const userRole = matchedRole || 'user';

      setRole(userRole);
      setIsAdmin(hasAdminRole || hasSuperAdminRole || userRole === 'admin' || userRole === 'super_admin');
      setIsSuperAdmin(hasSuperAdminRole || userRole === 'super_admin');

      const { data: twoFAData } = await supabase
        .from('user_2fa')
        .select('is_enabled')
        .eq('user_id', userId)
        .maybeSingle();

      setHas2FAEnabled(twoFAData?.is_enabled || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin status');
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

  return (
    <AdminStatusContext.Provider
      value={{ isAdmin, isSuperAdmin, role, isLoading, error, has2FAEnabled, refresh: checkAdminStatus }}
    >
      {children}
    </AdminStatusContext.Provider>
  );
}

export function useAdminStatusContext(): AdminStatusContextValue {
  return useContext(AdminStatusContext);
}
