import { EmergencyAlertsTab } from '@/components/admin/tabs/EmergencyAlertsTab';

export default function AdminEmergency() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Emergency Alerts</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor and manage active safety alerts across the platform</p>
      </div>
      <EmergencyAlertsTab />
    </div>
  );
}
