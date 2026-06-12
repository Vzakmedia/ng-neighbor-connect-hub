import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { use2FAStatus } from '@/hooks/use2FAStatus';

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
  const location = useLocation();
  // 2FA only gates role-protected (admin/staff) areas — the general app is
  // always accessible to a signed-in user, with or without 2FA verification.
  const enforce2FA = !!requiredRole;
  // Cached via React Query (staleTime 5 min) — does NOT re-fetch on every route render.
  const { data: twoFA, isLoading: twoFALoading } = use2FAStatus(enforce2FA ? user?.id : undefined);

  const initialRoleLoad = !!user && role === null && roleLoading;
  const twoFAGateLoading = !!user && enforce2FA && twoFALoading;

  if (authLoading || initialRoleLoad || twoFAGateLoading) {
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

  if (enforce2FA && twoFA?.enabled && !twoFA.verified) {
    sessionStorage.setItem('pending2FA', user.id);
    // Remember where they were headed so verification returns them there
    sessionStorage.setItem('post2fa_redirect', location.pathname + location.search);
    return <Navigate to={`/auth/2fa-verify?userId=${user.id}`} replace />;
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
