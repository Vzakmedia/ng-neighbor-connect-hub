import { useAdminStatus } from '@/hooks/useAdminStatus';
import { UsersTab } from '@/components/admin/tabs/UsersTab';

export default function AdminUsers() {
  const { isSuperAdmin } = useAdminStatus();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage members, roles, and verification</p>
      </div>
      <UsersTab isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
