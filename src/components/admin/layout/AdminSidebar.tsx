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
  Briefcase,
  TrendingUp,
  Mail,
  UserCog,
  Activity,
  Home,
  Building2,
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
  { label: 'Staff',          path: '/admin/staff',        icon: UserCog },
  { label: 'Emergency',      path: '/admin/emergency',    icon: AlertTriangle },
  { label: 'Content',        path: '/admin/content',      icon: MessageSquare },
  { label: 'Marketplace',    path: '/admin/marketplace',  icon: ShoppingCart },
  { label: 'Business',       path: '/admin/business',     icon: Briefcase },
  { label: 'Advertising',    path: '/admin/advertising',  icon: TrendingUp },
  { label: 'Email',          path: '/admin/email',        icon: Mail },
  { label: 'Analytics',      path: '/admin/analytics',    icon: BarChart3 },
  { label: 'Performance',    path: '/admin/performance',  icon: Activity },
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
        'flex flex-col h-screen bg-card text-card-foreground border-r border-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img src={LOGO_URL} alt="NeighborLink" className="h-8 w-8 rounded-full shrink-0 object-cover" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">NeighborLink</p>
              <p className="text-[11px] text-muted-foreground truncate">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={LOGO_URL} alt="NeighborLink" className="h-8 w-8 rounded-full object-cover mx-auto" />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
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
                'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-0',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && item.badge && (
              <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quick links: staff portal + back to the app */}
      <div className="border-t border-border px-2 py-2 space-y-1">
        <NavLink
          to="/staff-portal"
          className={cn(
            'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? 'Staff Portal' : undefined}
        >
          <Building2 className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">Staff Portal</span>}
        </NavLink>
        <NavLink
          to="/dashboard"
          className={cn(
            'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? 'Back to App' : undefined}
        >
          <Home className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="truncate">Back to App</span>}
        </NavLink>
      </div>

      {/* User info + sign out */}
      <div className="border-t border-border px-2 py-3 space-y-2">
        {!collapsed && (
          <div className="px-2 py-1">
            <p className="text-xs font-semibold truncate text-foreground">
              {user?.email?.split('@')[0] ?? 'Admin'}
            </p>
            <p className="text-[11px] text-muted-foreground">{roleLabel}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            'w-full text-muted-foreground hover:bg-muted hover:text-foreground',
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
