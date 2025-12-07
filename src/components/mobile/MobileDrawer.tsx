import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileIcons } from '@/hooks/useMobileIcons';
import { useAuth } from '@/hooks/useAuth';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import {
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  ShoppingBagIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  UsersIcon as UsersSolid,
  ChatBubbleLeftIcon as ChatBubbleLeftSolid,
  ShoppingBagIcon as ShoppingBagSolid,
  CalendarIcon as CalendarSolid,
  Cog6ToothIcon as Cog6ToothSolid,
  ShieldCheckIcon as ShieldCheckSolid,
  BriefcaseIcon as BriefcaseSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  iconSolid: React.ComponentType<any>;
  badge?: number;
  requiresAuth?: boolean;
  staffOnly?: boolean;
}

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificationCount?: number;
  hasStaffRole?: boolean;
}

const isNativePlatform = (): boolean => {
  return (window as any).Capacitor?.isNativePlatform?.() === true;
};

const triggerHaptic = async () => {
  if (!isNativePlatform()) return;
  
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.log('Haptics not available');
  }
};

/**
 * MobileDrawer - "More" navigation drawer for mobile/native apps
 * Shows additional navigation items that don't fit in the bottom nav bar
 */
export const MobileDrawer = ({ 
  open,
  onOpenChange,
  notificationCount = 0,
  hasStaffRole = false 
}: MobileDrawerProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { shouldUseFilledIcons } = useMobileIcons();

  // Navigation items for the More drawer (not in bottom nav)
  const navItems: NavItem[] = [
    { 
      id: 'community', 
      label: 'Groups', 
      path: '/community', 
      icon: UsersIcon, 
      iconSolid: UsersSolid 
    },
    { 
      id: 'events', 
      label: 'Events', 
      path: '/events', 
      icon: CalendarIcon, 
      iconSolid: CalendarSolid 
    },
    { 
      id: 'marketplace', 
      label: 'Marketplace', 
      path: '/marketplace', 
      icon: ShoppingBagIcon, 
      iconSolid: ShoppingBagSolid 
    },
    { 
      id: 'services', 
      label: 'Services', 
      path: '/services', 
      icon: BriefcaseIcon, 
      iconSolid: BriefcaseSolid 
    },
    { 
      id: 'safety', 
      label: 'Safety Center', 
      path: '/safety', 
      icon: ShieldCheckIcon, 
      iconSolid: ShieldCheckSolid 
    },
    { 
      id: 'users', 
      label: 'User Directory', 
      path: '/users', 
      icon: UsersIcon, 
      iconSolid: UsersSolid,
      staffOnly: true,
      requiresAuth: true 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      path: '/settings', 
      icon: Cog6ToothIcon, 
      iconSolid: Cog6ToothSolid,
      requiresAuth: true 
    },
  ];

  const handleNavigation = async (path: string) => {
    await triggerHaptic();
    navigate(path);
    onOpenChange(false);
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.staffOnly && !hasStaffRole) return false;
    return true;
  });


  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <DrawerTitle className="text-lg font-semibold">More</DrawerTitle>
          <DrawerClose asChild>
            <button className="rounded-full p-2 hover:bg-muted transition-colors">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        
        <div className="overflow-y-auto px-4 pb-6">
          <div className="pt-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all touch-manipulation active:scale-[0.98] ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="font-medium text-left flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Staff Portal - separate section */}
          {hasStaffRole && (
            <div className="pt-6 mt-6 border-t">
              <button
                onClick={() => handleNavigation('/staff')}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-all"
              >
                <ShieldCheckIcon className="h-5 w-5 flex-shrink-0 text-orange-500" />
                <div className="text-left flex-1">
                  <div className="font-medium">Staff Portal</div>
                  <div className="text-xs text-muted-foreground">Platform management</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
