import BusinessVerificationAdmin from '@/components/BusinessVerificationAdmin';

export default function AdminBusiness() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Management</h1>
        <p className="text-slate-500 text-sm mt-1">Review and verify business registrations</p>
      </div>
      <BusinessVerificationAdmin />
    </div>
  );
}
