import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
  Plug,
  Shield,
  MessageSquare,
  FileKey,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const LOGO_URL =
  'https://cowiviqhrnmhttugozbz.supabase.co/storage/v1/object/public/onboarding-assets/neighborlink-logo.jpeg';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',       path: '/admin',              icon: LayoutDashboard },
  { label: 'Users',          path: '/admin/users',        icon: Users },
  { label: 'Emergency',      path: '/admin/emergency',    icon: AlertTriangle },
  { label: 'Content',        path: '/admin/content',      icon: MessageSquare },
  { label: 'Marketplace',    path: '/admin/marketplace',  icon: ShoppingCart },
  { label: 'Analytics',      path: '/admin/analytics',    icon: BarChart3 },
  { label: 'Integrations',   path: '/admin/integrations', icon: Plug },
  { label: 'Security',       path: '/admin/security',     icon: Shield },
  { label: 'API Requests',   path: '/admin/api-requests', icon: FileKey },
  { label: 'Broadcast',      path: '/admin/broadcast',    icon: Megaphone },
  { label: 'Audit Log',      path: '/admin/audit-log',    icon: ClipboardList },
];

export function AdminSidebar() {
  const { signOut, user } = useAuth();
  const { role } = useAdminStatus();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const roleLabel = role === 'super_admin' ? 'Super Admin'
    : role === 'admin' ? 'Admin'
    : role === 'moderator' ? 'Moderator'
    : 'Staff';

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-slate-900 text-slate-100 transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img src={LOGO_URL} alt="NeighborLink" className="h-8 w-8 rounded-full shrink-0 object-cover" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">NeighborLink</p>
              <p className="text-[11px] text-slate-400 truncate">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={LOGO_URL} alt="NeighborLink" className="h-8 w-8 rounded-full object-cover mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700 shrink-0"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                collapsed && 'justify-center px-0',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge && (
              <Badge className="ml-auto bg-rose-600 text-white text-[10px] px-1.5 py-0">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-slate-700 px-2 py-3 space-y-2">
        {!collapsed && (
          <div className="px-2 py-1">
            <p className="text-xs font-medium truncate text-slate-200">
              {user?.email?.split('@')[0] ?? 'Admin'}
            </p>
            <p className="text-[11px] text-slate-400">{roleLabel}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            'w-full text-slate-300 hover:bg-slate-700 hover:text-white',
            collapsed ? 'justify-center px-0' : 'justify-start gap-2',
          )}
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </Button>
      </div>
    </aside>
  );
}
