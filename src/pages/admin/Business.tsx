import BusinessVerificationAdmin from '@/components/BusinessVerificationAdmin';

export default function AdminBusiness() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Business Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and verify business registrations</p>
      </div>
      <BusinessVerificationAdmin />
    </div>
  );
}
