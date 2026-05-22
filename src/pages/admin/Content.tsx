import { useState } from 'react';
import { cn } from '@/lib/utils';
import ContentModerationPanel from '@/components/ContentModerationPanel';
import ContentManagementPanel from '@/components/ContentManagementPanel';
import { BlogManagementPanel } from '@/components/admin/BlogManagementPanel';
import NewsletterSubscribersPanel from '@/components/admin/NewsletterSubscribersPanel';
import { Shield, FileText, BookOpen, Mail } from 'lucide-react';

const SECTIONS = [
  { id: 'moderation',  label: 'Moderation',  icon: Shield,    component: ContentModerationPanel },
  { id: 'management',  label: 'Management',  icon: FileText,  component: ContentManagementPanel },
  { id: 'blog',        label: 'Blog',        icon: BookOpen,  component: BlogManagementPanel },
  { id: 'newsletter',  label: 'Newsletter',  icon: Mail,      component: NewsletterSubscribersPanel },
];

export default function AdminContent() {
  const [active, setActive] = useState('moderation');
  const ActiveComponent = SECTIONS.find(s => s.id === active)!.component;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content</h1>
        <p className="text-slate-500 text-sm mt-1">Moderate posts, manage blog articles, and newsletter subscribers</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-slate-200">
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
