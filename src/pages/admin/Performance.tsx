import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';

export default function AdminPerformance() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Performance</h1>
        <p className="text-slate-500 text-sm mt-1">Platform performance metrics and monitoring</p>
      </div>
      <PerformanceDashboard />
    </div>
  );
}
