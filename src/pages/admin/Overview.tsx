import { OverviewTab } from '@/components/admin/tabs/OverviewTab';

export default function AdminOverview() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform health and key metrics at a glance</p>
      </div>
      <OverviewTab />
    </div>
  );
}
