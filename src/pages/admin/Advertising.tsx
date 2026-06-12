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
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Advertising</h1>
        <p className="text-muted-foreground text-sm mt-1">Ad platform settings and promotion campaigns</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              active === s.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
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
