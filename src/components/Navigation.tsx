import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CreatePostDialog from './CreatePostDialog';
import { useNotifications } from '@/hooks/useSimpleNotifications';
import { useReadStatus } from '@/hooks/useReadStatus';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  MessageSquare, 
  MessageCircle,
  ShoppingBag, 
  Shield, 
  Calendar,
  Users,
  Building,
  Plus,
  Settings,
  Building2,
  Briefcase
} from 'lucide-react';

const Navigation = () => {
  const { unreadCounts } = useReadStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [hasStaffRole, setHasStaffRole] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['super_admin', 'moderator', 'manager', 'support', 'staff'])
          .maybeSingle();
        
        setHasStaffRole(!!data?.role);
      } catch (error) {
        setHasStaffRole(false);
      }
    };
    
    checkStaffRole();
  }, [user]);
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', count: 0, path: '/' },
    { id: 'community', icon: Users, label: 'Groups', count: unreadCounts.community, path: '/community' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', count: unreadCounts.messages, path: '/messages' },
    { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'users', icon: Users, label: 'User Directory', count: 0, path: '/users' },
    { id: 'safety', icon: Shield, label: 'Safety', count: 0, path: '/safety' },
    { id: 'events', icon: Calendar, label: 'Events', count: 0, path: '/events' },
    { id: 'services', icon: Briefcase, label: 'Services', count: 0, path: '/services' },
  ];

  // Mobile-specific order with Messages in middle of first 5 items
  const mobileNavItems = [
    { id: 'home', icon: Home, label: 'Home', count: 0, path: '/' },
    { id: 'community', icon: Users, label: 'Groups', count: unreadCounts.community, path: '/community' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', count: unreadCounts.messages, path: '/messages' },
    { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'safety', icon: Shield, label: 'Safety', count: 0, path: '/safety' },
    { id: 'users', icon: Users, label: 'User Directory', count: 0, path: '/users' },
    { id: 'services', icon: Briefcase, label: 'Services', count: 0, path: '/services' },
    { id: 'events', icon: Calendar, label: 'Events', count: 0, path: '/events' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleMobileNavigation = async (path: string) => {
    // Trigger haptic feedback on mobile
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Haptics not available (e.g., on web), silently continue
    }
    navigate(path);
  };

  return (
    <>
      {/* Desktop Sidebar - Full width on desktop, icon-only on tablet */}
      <aside className="hidden md:flex md:w-16 lg:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 bg-card border-r" data-tutorial="navigation">
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          {/* Create Post Button - hidden on tablet, full on desktop */}
          <div className="px-2 lg:px-4 mb-4">
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity lg:px-4 md:px-2"
              onClick={() => setCreatePostOpen(true)}
              data-tutorial="create-post"
            >
              <Plus className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Create Post</span>
            </Button>
          </div>
          
          <nav className="flex-1 px-1 lg:px-2 space-y-1">
            {navItems.map((item) => {
              // Hide User Directory for non-staff users
              if (item.id === 'users' && !hasStaffRole) {
                return null;
              }
              
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-sm rounded-md transition-colors relative group ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  title={item.label} // Tooltip for tablet view
                >
                  <Icon className="h-5 w-5 lg:mr-3 flex-shrink-0" />
                  <span className="hidden lg:block flex-1 text-left">{item.label}</span>
                  {item.count > 0 && (
                    <>
                      {/* Desktop badge */}
                      <Badge variant="secondary" className="hidden lg:block ml-auto">
                        {item.count}
                      </Badge>
                      {/* Tablet notification dot */}
                      <div className="lg:hidden absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></div>
                    </>
                  )}
                  
                  {/* Tablet tooltip */}
                  <div className="lg:hidden absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                    {item.label}
                    {item.count > 0 && ` (${item.count})`}
                  </div>
                </button>
                );
              })}
              
              {/* Staff Portal Link for staff users */}
              {hasStaffRole && (
                <>
                  <div className="px-2 lg:px-3 py-2">
                    <div className="border-t border-muted" />
                  </div>
                  <button
                    onClick={() => navigate('/staff')}
                    className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-sm rounded-md transition-colors relative group ${
                      location.pathname === '/staff'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    title="Staff Portal"
                  >
                    <Settings className="h-5 w-5 lg:mr-3 flex-shrink-0" />
                    <span className="hidden lg:block flex-1 text-left">Staff Portal</span>
                    
                    {/* Tablet tooltip */}
                    <div className="lg:hidden absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                      Staff Portal
                    </div>
                  </button>
                </>
              )}
            </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex h-16">
          {/* Main nav items - 5 columns */}
          <div className="flex-1 grid grid-cols-5">
            {mobileNavItems.slice(0, 5).filter(item => {
              // Hide User Directory for non-staff users on mobile
              if (item.id === 'users' && !hasStaffRole) {
                return false;
              }
              return true;
            }).slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.path)}
                  className={`flex flex-col items-center justify-center space-y-1 transition-colors touch-manipulation ${
                    location.pathname === item.path
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.count > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-xs border border-background">
                        {item.count > 9 ? '9+' : item.count}
                      </Badge>
                    )}
                  </div>
                  {/* Show label only when active */}
                  {location.pathname === item.path && (
                    <span className="text-xs font-medium animate-fade-in">{item.label}</span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* More menu for additional items */}
          <div className="w-16 flex items-center justify-center border-l">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation h-full w-full">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                    </div>
                  </div>
                  <span className="text-xs font-medium">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="mb-2">
                {mobileNavItems.slice(5).filter(item => {
                  // Hide User Directory for non-staff users
                  if (item.id === 'users' && !hasStaffRole) {
                    return false;
                  }
                  return true;
                }).map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={async () => {
                        try {
                          await Haptics.impact({ style: ImpactStyle.Light });
                        } catch (error) {
                          // Haptics not available
                        }
                        handleNavigation(item.path);
                      }}
                      className="flex items-center py-3"
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      <span>{item.label}</span>
                      {item.count > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.count}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                {/* Staff Portal for mobile */}
                {hasStaffRole && (
                  <DropdownMenuItem 
                    onClick={() => navigate('/staff')}
                    className="flex items-center py-3"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Staff Portal</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => setCreatePostOpen(true)}
                  className="flex items-center py-3 text-primary"
                  data-tutorial="create-post-mobile"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  <span>Create Post</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </>
  );
};

export default Navigation;