import SecuritySettingsPanel from '@/components/admin/SecuritySettingsPanel';
import RateLimitingPanel from '@/components/admin/RateLimitingPanel';

// Business, Email, Staff, Advertising, and Performance used to live here as
// hidden sub-tabs — they are now first-class sidebar pages under /admin/*.
export default function AdminSecurity() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Security</h1>
        <p className="text-muted-foreground text-sm mt-1">Security policies and rate limiting</p>
      </div>
      <SecuritySettingsPanel />
      <RateLimitingPanel />
    </div>
  );
}
