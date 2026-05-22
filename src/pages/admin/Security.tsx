import { useState } from 'react';
import { cn } from '@/lib/utils';
import SecuritySettingsPanel from '@/components/admin/SecuritySettingsPanel';
import RateLimitingPanel from '@/components/admin/RateLimitingPanel';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';
import EmailManagementPanel from '@/components/admin/EmailManagementPanel';
import BusinessVerificationAdmin from '@/components/BusinessVerificationAdmin';
import StaffInvitationManager from '@/components/StaffInvitationManager';
import AdsSettingsPanel from '@/components/advertising/AdsSettingsPanel';
import { Shield, Gauge, Mail, Briefcase, Users, TrendingUp, Activity } from 'lucide-react';

const SECTIONS = [
  { id: 'security',     label: 'Security',     icon: Shield,     component: () => <div className="space-y-6"><SecuritySettingsPanel /><RateLimitingPanel /></div> },
  { id: 'performance',  label: 'Performance',  icon: Activity,   component: PerformanceDashboard },
  { id: 'email',        label: 'Email',        icon: Mail,       component: EmailManagementPanel },
  { id: 'business',     label: 'Business',     icon: Briefcase,  component: BusinessVerificationAdmin },
  { id: 'staff',        label: 'Staff',        icon: Users,      component: StaffInvitationManager },
  { id: 'advertising',  label: 'Advertising',  icon: TrendingUp, component: AdsSettingsPanel },
];

export default function AdminSecurity() {
  const [active, setActive] = useState('security');
  const ActiveComponent = SECTIONS.find(s => s.id === active)!.component;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security & Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure security policies, staff, email, advertising, and platform settings</p>
      </div>

      {/* Sub-nav */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === s.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      <ActiveComponent />
    </div>
  );
}
