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
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent inline-block">Content</h1>
        <p className="text-muted-foreground text-sm mt-1">Moderate posts, manage blog articles, and newsletter subscribers</p>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-1 border-b border-border">
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
