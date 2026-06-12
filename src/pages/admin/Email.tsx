import EmailManagementPanel from '@/components/admin/EmailManagementPanel';

export default function AdminEmail() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Email Management</h1>
        <p className="text-slate-500 text-sm mt-1">Email templates, delivery logs, and configuration</p>
      </div>
      <EmailManagementPanel />
    </div>
  );
}
