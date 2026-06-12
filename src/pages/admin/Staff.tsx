import StaffInvitationManager from '@/components/StaffInvitationManager';

export default function AdminStaff() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
        <p className="text-slate-500 text-sm mt-1">Invite and manage staff members</p>
      </div>
      <StaffInvitationManager />
    </div>
  );
}
