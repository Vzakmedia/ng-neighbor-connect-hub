import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useAdminAuditLog } from '@/hooks/useAdminAuditLog';
import { Admin2FAGate } from '@/components/security/Admin2FAGate';
import { AdminSessionGuard } from '@/components/security/AdminSessionGuard';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, isLoading } = useAdminStatus();
  const { logAdminSession } = useAdminAuditLog();

  // Record the admin session in the audit log — once per browser session
  useEffect(() => {
    if (!user || (!isAdmin && !isSuperAdmin)) return;
    const key = `admin_session_logged:${user.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* sessionStorage unavailable — log anyway */ }
    logAdminSession('admin_session_start');
  }, [user, isAdmin, isSuperAdmin, logAdminSession]);

  if (!user) return <Navigate to="/auth" replace />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <Admin2FAGate>
      <AdminSessionGuard>
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto bg-muted/40">
            <Outlet />
          </main>
        </div>
      </AdminSessionGuard>
    </Admin2FAGate>
  );
}
