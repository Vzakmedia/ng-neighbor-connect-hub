import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Admin2FAGate } from '@/components/security/Admin2FAGate';
import { AdminSessionGuard } from '@/components/security/AdminSessionGuard';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading } = useAdminStatus();

  if (!user) return <Navigate to="/auth" replace />;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isAdmin && !isSuperAdmin) return <Navigate to="/" replace />;

  return (
    <Admin2FAGate>
      <AdminSessionGuard>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </AdminSessionGuard>
    </Admin2FAGate>
  );
}
