import SecuritySettingsPanel from '@/components/admin/SecuritySettingsPanel';
import RateLimitingPanel from '@/components/admin/RateLimitingPanel';

// Business, Email, Staff, Advertising, and Performance used to live here as
// hidden sub-tabs — they are now first-class sidebar pages under /admin/*.
export default function AdminSecurity() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security</h1>
        <p className="text-slate-500 text-sm mt-1">Security policies and rate limiting</p>
      </div>
      <SecuritySettingsPanel />
      <RateLimitingPanel />
    </div>
  );
}
