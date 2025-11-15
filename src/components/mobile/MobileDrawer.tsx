import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useMobileIcons } from '@/hooks/useMobileIcons';
import { useAuth } from '@/hooks/useAuth';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Home, HomeSolid,
  Users, UsersSolid,
  MessageSquare, MessageSquareSolid,
  ShoppingBag, ShoppingBagSolid,
  Calendar, CalendarSolid,
  Settings, SettingsSolid,
  Bell, BellSolid,
  Shield, ShieldSolid,
  Menu,
  X,
  User,
} from '@/lib/icons';

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
  notificationCount?: number;
  hasStaffRole?: boolean;
}

export const MobileDrawer = ({ 
  notificationCount = 0,
  hasStaffRole = false 
}: MobileDrawerProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { shouldUseFilledIcons } = useMobileIcons();

  const navItems: NavItem[] = [
    { 
      id: 'home', 
      label: shouldUseFilledIcons ? 'Feed' : 'Home', 
      path: '/', 
      icon: Home, 
      iconSolid: HomeSolid 
    },
    { 
      id: 'community', 
      label: 'Community', 
      path: '/community', 
      icon: Users, 
      iconSolid: UsersSolid 
    },
    { 
      id: 'messages', 
      label: 'Messages', 
      path: '/messages', 
      icon: MessageSquare, 
      iconSolid: MessageSquareSolid,
      requiresAuth: true 
    },
    { 
      id: 'marketplace', 
      label: 'Marketplace', 
      path: '/marketplace', 
      icon: ShoppingBag, 
      iconSolid: ShoppingBagSolid 
    },
    { 
      id: 'events', 
      label: 'Events', 
      path: '/events', 
      icon: Calendar, 
      iconSolid: CalendarSolid 
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      iconSolid: BellSolid,
      badge: notificationCount,
      requiresAuth: true 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      path: '/settings', 
      icon: Settings, 
      iconSolid: SettingsSolid,
      requiresAuth: true 
    },
    { 
      id: 'staff', 
      label: 'Staff Portal', 
      path: '/staff', 
      icon: Shield, 
      iconSolid: ShieldSolid,
      staffOnly: true,
      requiresAuth: true 
    },
  ];

  const handleNavigation = async (path: string) => {
    // Haptic feedback on native platforms
    if (Capacitor.isNativePlatform()) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available');
      }
    }
    
    navigate(path);
    setOpen(false);
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    if (item.staffOnly && !hasStaffRole) return false;
    return true;
  });

  const getUserInitials = () => {
    if (!user?.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Navigation
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-6">
          {/* User Profile Section */}
          {user && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <Separator className="mb-6" />
            </>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              // Use solid icon on mobile/native when active
              const Icon = (isActive && shouldUseFilledIcons) 
                ? item.iconSolid 
                : item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    text-left transition-all touch-manipulation active:scale-98
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-foreground hover:bg-accent'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 font-medium text-sm">
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant={isActive ? "secondary" : "default"}
                      className="h-5 min-w-[20px] px-1.5 text-xs"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Profile Button (if not logged in) */}
          {!user && (
            <>
              <Separator className="my-6" />
              <Button
                onClick={() => handleNavigation('/profile')}
                className="w-full"
                variant="default"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
