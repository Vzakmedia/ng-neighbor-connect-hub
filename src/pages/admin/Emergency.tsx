import { EmergencyAlertsTab } from '@/components/admin/tabs/EmergencyAlertsTab';

export default function AdminEmergency() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Emergency Alerts</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor and manage active safety alerts across the platform</p>
      </div>
      <EmergencyAlertsTab />
    </div>
  );
}
