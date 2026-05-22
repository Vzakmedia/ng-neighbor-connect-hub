import { useAdminStatus } from '@/hooks/useAdminStatus';
import { UsersTab } from '@/components/admin/tabs/UsersTab';

export default function AdminUsers() {
  const { isSuperAdmin } = useAdminStatus();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 text-sm mt-1">Manage members, roles, and verification</p>
      </div>
      <UsersTab isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
