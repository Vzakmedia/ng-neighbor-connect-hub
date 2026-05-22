import { OverviewTab } from '@/components/admin/tabs/OverviewTab';

export default function AdminOverview() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Platform health and key metrics at a glance</p>
      </div>
      <OverviewTab />
    </div>
  );
}
