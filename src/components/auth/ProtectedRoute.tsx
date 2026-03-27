import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStatus } from '@/hooks/useAdminStatus';

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

  // Block only on the very first load:
  // - authLoading: session hasn't been read from storage yet
  // - role is still null AND roleLoading: we have a user but haven't fetched the role once yet
  // Re-checks (token refresh, background resume) must NOT trigger this spinner — the
  // existing role value continues to be used while the silent re-fetch runs.
  const initialRoleLoad = !!user && role === null && roleLoading;
  if (authLoading || initialRoleLoad) {
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

  if (requiredRole) {
    const requiredPriority = rolePriority[requiredRole] ?? 999;
    const userPriority = rolePriority[role ?? 'user'] ?? 0;
    if (userPriority < requiredPriority) {
      // Authenticated but insufficient privileges — go to dashboard, not login
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
