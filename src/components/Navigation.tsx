import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Safe haptic trigger - dynamically imports Capacitor only on native
const triggerHaptic = async () => {
  if (window.Capacitor?.isNativePlatform?.()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Silently fail on web or if haptics unavailable
    }
  }
};
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import CreatePostDialog from './CreatePostDialog';
import { useNotifications } from '@/hooks/useSimpleNotifications';
import { useReadStatus } from '@/hooks/useReadStatus';
import { useAuth } from '@/hooks/useAuth';
import { useMobileIcons } from '@/hooks/useMobileIcons';
import { ProfileMenu } from '@/components/mobile/ProfileMenu';
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
  XMarkIcon,
  NewspaperIcon,
  StarIcon
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
  XMarkIcon as XMarkSolid,
  NewspaperIcon as NewspaperSolid,
  StarIcon as StarSolid
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
    { id: 'home', icon: HomeIcon, iconSolid: HomeSolid, label: 'Overview', count: 0, path: '/home' },
    { id: 'feed', icon: NewspaperIcon, iconSolid: NewspaperSolid, label: 'Feed', count: 0, path: '/' },
    { id: 'community', icon: UsersIcon, iconSolid: UsersSolid, label: 'Groups', count: unreadCounts.community, path: '/community' },
    { id: 'messages', icon: ChatBubbleLeftIcon, iconSolid: ChatBubbleLeftSolid, label: 'Messages', count: unreadCounts.messages, path: '/messages' },
    { id: 'recommendations', icon: StarIcon, iconSolid: StarSolid, label: 'Recommendations', count: 0, path: '/recommendations' },
    { id: 'marketplace', icon: ShoppingBagIcon, iconSolid: ShoppingBagSolid, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'users', icon: UsersIcon, iconSolid: UsersSolid, label: 'User Directory', count: 0, path: '/users' },
    { id: 'safety', icon: ShieldCheckIcon, iconSolid: ShieldCheckSolid, label: 'Safety', count: 0, path: '/safety' },
    { id: 'events', icon: CalendarIcon, iconSolid: CalendarSolid, label: 'Events', count: 0, path: '/events' },
    { id: 'services', icon: BriefcaseIcon, iconSolid: BriefcaseSolid, label: 'Services', count: 0, path: '/services' },
  ];

  // Mobile bottom nav: Feed · Safety · [More] · Marketplace · Avatar
  const mobileBottomNavItems = [
    { id: 'feed',   icon: NewspaperIcon,   iconSolid: NewspaperSolid,   label: 'Feed',   count: 0, path: '/feed' },
    { id: 'safety', icon: ShieldCheckIcon, iconSolid: ShieldCheckSolid, label: 'Safety', count: 0, path: '/safety' },
  ];

  // Items to show in "More" drawer on mobile (Safety + Marketplace promoted to nav bar)
  const mobileDrawerItems = [
    { id: 'community',       icon: UsersIcon,         iconSolid: UsersSolid,         label: 'Groups',         count: unreadCounts.community, path: '/community' },
    { id: 'messages',        icon: ChatBubbleLeftIcon, iconSolid: ChatBubbleLeftSolid, label: 'Messages',       count: unreadCounts.messages,  path: '/messages' },
    { id: 'recommendations', icon: StarIcon,           iconSolid: StarSolid,           label: 'Recommendations',count: 0,                      path: '/recommendations' },
    { id: 'events',          icon: CalendarIcon,       iconSolid: CalendarSolid,       label: 'Events',         count: 0,                      path: '/events' },
    { id: 'services',        icon: BriefcaseIcon,      iconSolid: BriefcaseSolid,      label: 'Services',       count: 0,                      path: '/services' },
    { id: 'users',           icon: UsersIcon,          iconSolid: UsersSolid,          label: 'User Directory', count: 0,                      path: '/users' },
    { id: 'settings',        icon: Cog6ToothIcon,      iconSolid: Cog6ToothSolid,      label: 'Settings',       count: 0,                      path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleMobileNavigation = async (path: string) => {
    await triggerHaptic();
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
                  className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-sm rounded-md transition-colors relative group ${location.pathname === item.path
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
                  onClick={() => navigate('/staff-portal')}
                  className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-3 py-2 text-sm rounded-md transition-colors relative group ${location.pathname.startsWith('/staff-portal')
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

      {/* Mobile Bottom Navigation - Icon only design with centered More button */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border rounded-t-3xl z-50" style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: 'hsl(var(--card))'
      }}>
        <div className="flex h-20 items-center justify-evenly px-4">
          {/* Home */}
          {mobileBottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = (isActive && shouldUseFilledIcons) ? item.iconSolid : item.icon;
            return (
              <button
                key={item.id}
                onPointerDown={() => handleMobileNavigation(item.path)}
                className={`p-2 ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                <Icon className="h-8 w-8" />
              </button>
            );
          })}

          {/* More Button - Centered with Primary Background and Shadow */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              await triggerHaptic();
              setMoreDrawerOpen((prev) => !prev);
            }}
            className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-lg shadow-primary/30"
          >
            <Squares2X2Icon className="h-8 w-8" />
          </button>

          {/* Marketplace */}
          <button
            onPointerDown={() => handleMobileNavigation('/marketplace')}
            className={`relative p-2 ${location.pathname === '/marketplace' ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            {(location.pathname === '/marketplace' && shouldUseFilledIcons) ? (
              <ShoppingBagSolid className="h-8 w-8" />
            ) : (
              <ShoppingBagIcon className="h-8 w-8" />
            )}
          </button>

          {/* Profile Menu */}
          <ProfileMenu />
        </div>
      </nav>

      {/* Custom Floating Drawer/Popover Overlay */}
      {moreDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-background/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMoreDrawerOpen(false)}
        >
          {/* Popover Card */}
          <div 
            className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto bg-card border border-border/50 shadow-2xl rounded-[32px] p-6 pb-5 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent close on clicking inside the card
          >
            {/* Grid of Options */}
            <div className="grid grid-cols-3 gap-y-6 gap-x-4 justify-items-center">
              {mobileDrawerItems.filter(item => {
                if (item.id === 'users' && !hasStaffRole) return false;
                return true;
              }).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={async () => {
                      await triggerHaptic();
                      handleNavigation(item.path);
                      setMoreDrawerOpen(false);
                    }}
                    className="flex flex-col items-center gap-2.5 touch-manipulation active:scale-95 transition-transform group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shadow-inner transition-transform duration-200 group-hover:scale-105">
                      <Icon className="h-6.5 w-6.5 text-primary" />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground/90 text-center leading-tight max-w-[80px]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Caret / Pointer pointing down to More button */}
            <div 
              className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]"
              style={{ borderTopColor: 'hsl(var(--card))' }}
            />
            <div 
              className="absolute bottom-[-9px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-border/50 -z-10"
            />
          </div>
        </div>
      )}

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />
    </>
  );
};

export default Navigation;