import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import CreatePostDialog from './CreatePostDialog';
import { useNotifications } from '@/hooks/useSimpleNotifications';
import { useReadStatus } from '@/hooks/useReadStatus';
import { useAuth } from '@/hooks/useAuth';
import { useMobileIcons } from '@/hooks/useMobileIcons';
import { supabase } from '@/integrations/supabase/client';
import { 
  HomeIcon,
  ChatBubbleLeftIcon,
  ShoppingBagIcon,
  ShieldCheckIcon,
  CalendarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  PlusIcon,
  Cog6ToothIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  Squares2X2Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid,
  ChatBubbleLeftIcon as ChatBubbleLeftSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  ShieldCheckIcon as ShieldCheckSolid,
  CalendarIcon as CalendarSolid,
  UsersIcon as UsersSolid,
  BuildingOfficeIcon as BuildingOfficeSolid,
  PlusIcon as PlusSolid,
  Cog6ToothIcon as Cog6ToothSolid,
  BuildingOffice2Icon as BuildingOffice2Solid,
  BriefcaseIcon as BriefcaseSolid,
  Squares2X2Icon as Squares2X2Solid,
  XMarkIcon as XMarkSolid
} from '@heroicons/react/24/solid';

const Navigation = () => {
  const { shouldUseFilledIcons } = useMobileIcons();
  const { unreadCounts } = useReadStatus();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [hasStaffRole, setHasStaffRole] = useState(false);
  const { unreadCount } = useNotifications();
  const [animatingBadges, setAnimatingBadges] = useState<Record<string, boolean>>({});
  const prevCountsRef = useRef<Record<string, number>>({});

  // Detect unread count increases and trigger animation
  useEffect(() => {
    const newAnimating: Record<string, boolean> = {};
    
    if (prevCountsRef.current.community !== undefined && 
        unreadCounts.community > prevCountsRef.current.community) {
      newAnimating.community = true;
    }
    
    if (prevCountsRef.current.messages !== undefined && 
        unreadCounts.messages > prevCountsRef.current.messages) {
      newAnimating.messages = true;
    }
    
    if (Object.keys(newAnimating).length > 0) {
      setAnimatingBadges(newAnimating);
      
      // Remove animation after it completes
      const timer = setTimeout(() => {
        setAnimatingBadges({});
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    // Update previous counts
    prevCountsRef.current = {
      community: unreadCounts.community,
      messages: unreadCounts.messages
    };
  }, [unreadCounts.community, unreadCounts.messages]);

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
    { id: 'home', icon: HomeIcon, iconSolid: HomeSolid, label: 'Home', count: 0, path: '/' },
    { id: 'community', icon: UsersIcon, iconSolid: UsersSolid, label: 'Groups', count: unreadCounts.community, path: '/community' },
    { id: 'messages', icon: ChatBubbleLeftIcon, iconSolid: ChatBubbleLeftSolid, label: 'Messages', count: unreadCounts.messages, path: '/messages' },
    { id: 'marketplace', icon: ShoppingBagIcon, iconSolid: ShoppingBagSolid, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'users', icon: UsersIcon, iconSolid: UsersSolid, label: 'User Directory', count: 0, path: '/users' },
    { id: 'safety', icon: ShieldCheckIcon, iconSolid: ShieldCheckSolid, label: 'Safety', count: 0, path: '/safety' },
    { id: 'events', icon: CalendarIcon, iconSolid: CalendarSolid, label: 'Events', count: 0, path: '/events' },
    { id: 'services', icon: BriefcaseIcon, iconSolid: BriefcaseSolid, label: 'Services', count: 0, path: '/services' },
  ];

  // Mobile-specific order with Messages in middle of first 5 items
  const mobileNavItems = [
    { id: 'home', icon: HomeIcon, iconSolid: HomeSolid, label: 'Home', count: 0, path: '/' },
    { id: 'community', icon: UsersIcon, iconSolid: UsersSolid, label: 'Groups', count: unreadCounts.community, path: '/community' },
    { id: 'messages', icon: ChatBubbleLeftIcon, iconSolid: ChatBubbleLeftSolid, label: 'Messages', count: unreadCounts.messages, path: '/messages' },
    { id: 'marketplace', icon: ShoppingBagIcon, iconSolid: ShoppingBagSolid, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'safety', icon: ShieldCheckIcon, iconSolid: ShieldCheckSolid, label: 'Safety', count: 0, path: '/safety' },
    { id: 'users', icon: UsersIcon, iconSolid: UsersSolid, label: 'User Directory', count: 0, path: '/users' },
    { id: 'services', icon: BriefcaseIcon, iconSolid: BriefcaseSolid, label: 'Services', count: 0, path: '/services' },
    { id: 'events', icon: CalendarIcon, iconSolid: CalendarSolid, label: 'Events', count: 0, path: '/events' },
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
              <PlusIcon className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Create Post</span>
            </Button>
          </div>
          
          <nav className="flex-1 px-1 lg:px-2 space-y-1">
            {navItems.map((item) => {
              // Hide User Directory for non-staff users
              if (item.id === 'users' && !hasStaffRole) {
                return null;
              }
              
              const isActive = location.pathname === item.path;
              // Only use solid icons on mobile/native platforms
              const Icon = (isActive && shouldUseFilledIcons) ? item.iconSolid : item.icon;
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
                      <Badge 
                        variant="secondary" 
                        className={`hidden lg:block ml-auto ${animatingBadges[item.id] ? 'animate-bounce-subtle' : ''}`}
                      >
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
                    <Cog6ToothIcon className="h-5 w-5 lg:mr-3 flex-shrink-0" />
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
              const isActive = location.pathname === item.path;
              // Mobile nav: use solid icons when active (mobile-only feature)
              const Icon = (isActive && shouldUseFilledIcons) ? item.iconSolid : item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigation(item.path)}
                  className={`flex flex-col items-center justify-center space-y-1 transition-all touch-manipulation active:scale-95 ${
                    location.pathname === item.path
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {item.count > 0 && (
                      <Badge 
                        className={`absolute -top-1 -right-1 h-3 w-3 rounded-full p-0 flex items-center justify-center text-xs border border-background ${animatingBadges[item.id] ? 'animate-bounce-subtle' : ''}`}
                      >
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
            <button 
              onClick={async () => {
                try {
                  await Haptics.impact({ style: ImpactStyle.Light });
                } catch (error) {
                  // Haptics not available
                }
                setMoreDrawerOpen(true);
              }}
              className="flex flex-col items-center justify-center space-y-1 text-muted-foreground hover:text-foreground transition-all touch-manipulation active:scale-95 h-full w-full"
            >
              <Squares2X2Icon className="h-6 w-6" />
              <span className="text-xs font-medium">More</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Modern Bottom Drawer for More Options */}
      <Drawer open={moreDrawerOpen} onOpenChange={setMoreDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex items-center justify-between border-b pb-4">
            <DrawerTitle className="text-lg font-semibold">More Options</DrawerTitle>
            <DrawerClose asChild>
              <button className="rounded-full p-2 hover:bg-muted transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </DrawerClose>
          </DrawerHeader>
          
          <div className="overflow-y-auto px-4 pb-6">
            {/* Navigation Section */}
            {mobileNavItems.slice(5).filter(item => {
              if (item.id === 'users' && !hasStaffRole) {
                return false;
              }
              return true;
            }).length > 0 && (
              <div className="pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Navigation</h3>
                <div className="space-y-1">
                  {mobileNavItems.slice(5).filter(item => {
                    if (item.id === 'users' && !hasStaffRole) {
                      return false;
                    }
                    return true;
                  }).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.id}
                        onClick={async () => {
                          try {
                            await Haptics.impact({ style: ImpactStyle.Light });
                          } catch (error) {
                            // Haptics not available
                          }
                          handleNavigation(item.path);
                          setMoreDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
                          isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium text-left flex-1">{item.label}</span>
                        {item.count > 0 && (
                          <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
                            {item.count > 9 ? '9+' : item.count}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions Section */}
            <div className="pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Quick Actions</h3>
              <div className="space-y-1">
                <button
                  onClick={async () => {
                    try {
                      await Haptics.impact({ style: ImpactStyle.Light });
                    } catch (error) {
                      // Haptics not available
                    }
                    setCreatePostOpen(true);
                    setMoreDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-all touch-manipulation active:scale-[0.98]"
                  data-tutorial="create-post-mobile"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold">Create Post</div>
                    <div className="text-xs opacity-80">Share with your community</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Settings Section (Staff Portal) */}
            {hasStaffRole && (
              <div className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Settings</h3>
                <div className="space-y-1">
                  <button
                    onClick={async () => {
                      try {
                        await Haptics.impact({ style: ImpactStyle.Light });
                      } catch (error) {
                        // Haptics not available
                      }
                      navigate('/staff');
                      setMoreDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-all touch-manipulation active:scale-[0.98]"
                  >
                    <Cog6ToothIcon className="h-5 w-5 flex-shrink-0" />
                    <div className="text-left flex-1">
                      <div className="font-medium">Staff Portal</div>
                      <div className="text-xs text-muted-foreground">Manage platform settings</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </>
  );
};

export default Navigation;