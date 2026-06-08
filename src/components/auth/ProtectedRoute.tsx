import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * If provided, the user must have this role (or a higher privilege).
   * Hierarchy: super_admin > admin > moderator | manager | support | staff
   */
  requiredRole?: 'admin' | 'super_admin' | 'moderator' | 'manager' | 'support' | 'staff';
  /** Redirect target when unauthenticated (default: /auth) */
  redirectTo?: string;
}

const rolePriority: Record<string, number> = {
  super_admin: 100,
  admin: 90,
  moderator: 50,
  manager: 50,
  support: 50,
  staff: 40,
  user: 1,
};

/**
 * ProtectedRoute — enforces authentication at the routing layer.
 *
 * Usage:
 *   <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
 *
 * - Unauthenticated users → /auth
 * - Users with insufficient role → /dashboard
 * - Shows a full-screen spinner while auth/role is loading
 */
export function ProtectedRoute({ children, requiredRole, redirectTo = '/auth' }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, isLoading: roleLoading } = useAdminStatus();
  const [twoFAStatus, setTwoFAStatus] = useState<'loading' | 'required' | 'verified' | 'not-required'>('loading');

  useEffect(() => {
    if (!user) { setTwoFAStatus('not-required'); return; }

    let cancelled = false;
    const check = async () => {
      const [{ data: twoFARow }, { data: sessionRow }] = await Promise.all([
        supabase.from('user_2fa').select('is_enabled').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_2fa_sessions').select('expires_at').eq('user_id', user.id).maybeSingle(),
      ]);
      if (cancelled) return;

      if (!twoFARow?.is_enabled) { setTwoFAStatus('not-required'); return; }

      const verified = !!sessionRow && new Date(sessionRow.expires_at) > new Date();
      setTwoFAStatus(verified ? 'verified' : 'required');
    };
    check();
    return () => { cancelled = true; };
  }, [user]);

  const initialRoleLoad = !!user && role === null && roleLoading;
  if (authLoading || initialRoleLoad || (!!user && twoFAStatus === 'loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Server-side 2FA gate: redirect to verification page if 2FA is enabled but not verified.
  if (twoFAStatus === 'required') {
    const userId = user.id;
    sessionStorage.setItem('pending2FA', userId);
    return <Navigate to={`/auth/2fa-verify?userId=${userId}`} replace />;
  }

  if (requiredRole) {
    const requiredPriority = rolePriority[requiredRole] ?? 999;
    const userPriority = rolePriority[role ?? 'user'] ?? 0;
    if (userPriority < requiredPriority) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
