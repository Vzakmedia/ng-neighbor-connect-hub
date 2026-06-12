import { useState } from 'react';
import { cn } from '@/lib/utils';
import AdsSettingsPanel from '@/components/advertising/AdsSettingsPanel';
import { PromotionManagement } from '@/components/PromotionManagement';
import { Settings, Megaphone } from 'lucide-react';

const SECTIONS = [
  { id: 'settings',   label: 'Ad Settings', icon: Settings,  component: AdsSettingsPanel },
  { id: 'promotions', label: 'Promotions',  icon: Megaphone, component: PromotionManagement },
];

export default function AdminAdvertising() {
  const [active, setActive] = useState('settings');
  const ActiveComponent = SECTIONS.find(s => s.id === active)!.component;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Advertising</h1>
        <p className="text-slate-500 text-sm mt-1">Ad platform settings and promotion campaigns</p>
      </div>

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
