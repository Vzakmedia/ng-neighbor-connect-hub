import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Bell, Search, Menu, MapPin, User, LogOut, Settings, MessageCircle } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useReadStatus } from "@/hooks/useReadStatus";
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { playNotification } from '@/utils/audioUtils';
import NotificationPanel from '@/components/NotificationPanel';

const Header = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { profile, getDisplayName, getInitials, getLocation } = useProfile();
  const { unreadCounts } = useReadStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotificationCount();
      subscribeToNotifications();
      subscribeToMessages(); // Always listen for message notifications
    }
    
    return () => {
      cleanupSafeSubscription('header-notifications', 'Header');
      cleanupSafeSubscription('header-messages', 'HeaderMessages');
    };
  }, [user]);

  const loadNotificationCount = async () => {
    if (!user) return;
    
    console.log('Header: Loading notification count...');
    try {
      const { data, error } = await supabase
        .from('alert_notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      setNotificationCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const subscribeToNotifications = () => {
    console.log('Header: Starting safe subscription to notifications...');
    
    createSafeSubscription(
      (channel) => channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alert_notifications',
            filter: `recipient_id=eq.${user?.id}`
          },
          (payload) => {
            console.log('Header: Received notification INSERT event');
            loadNotificationCount();
            
            // Play notification sound
            if (payload.new) {
              const notification = payload.new as any;
              if (notification.notification_type === 'panic_alert') {
                playNotification('emergency', 0.8);
              } else if (notification.notification_type === 'contact_request') {
                playNotification('notification', 0.5);
              } else {
                playNotification('normal', 0.3);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'alert_notifications',
            filter: `recipient_id=eq.${user?.id}`
          },
          () => {
            console.log('Header: Received notification UPDATE event');
            loadNotificationCount();
          }
        ),
      {
        channelName: 'header-notifications',
        onError: loadNotificationCount,
        pollInterval: 30000,
        debugName: 'Header'
      }
    );
  };

  const subscribeToMessages = () => {
    console.log('Header: Starting safe subscription to messages...');
    
    createSafeSubscription(
      (channel) => channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `recipient_id=eq.${user?.id}`
          },
          (payload) => {
            console.log('Header: Received message INSERT event');
            // Play message notification sound
            playNotification('notification', 0.4);
          }
        ),
      {
        channelName: 'header-messages',
        onError: () => console.log('Message notification subscription error'),
        pollInterval: 30000,
        debugName: 'HeaderMessages'
      }
    );
  };

  const handleNotificationClick = () => {
    setNotificationPanelOpen(!notificationPanelOpen);
    console.log('Notification bell clicked - count:', notificationCount);
  };

  const handleMessagesClick = () => {
    navigate('/messages');
    console.log('Messages icon clicked - count:', unreadCounts.messages);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">NG</span>
              </div>
              <span className="font-semibold text-lg">NextDoor NG</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search neighborhood..." 
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{getLocation()}</span>
            </div>
            
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative" onClick={handleMessagesClick}>
              <MessageCircle className="h-5 w-5" />
              {unreadCounts.messages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-600">
                  {unreadCounts.messages}
                </Badge>
              )}
            </Button>
            
            <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
              <Bell className="h-5 w-5" />
              {unreadCounts.notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCounts.notifications}
                </Badge>
              )}
            </Button>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                      )}
                      <AvatarFallback>
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{getDisplayName()}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">NG</span>
            </div>
            <span className="font-semibold text-lg">NextDoor NG</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
            
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={handleMessagesClick}>
              <MessageCircle className="h-4 w-4" />
              {unreadCounts.messages > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-green-600">
                  {unreadCounts.messages}
                </Badge>
              )}
            </Button>
            
            <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={handleNotificationClick}>
              <Bell className="h-4 w-4" />
              {unreadCounts.notifications > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCounts.notifications}
                </Badge>
              )}
            </Button>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 rounded-full">
                    <Avatar className="h-7 w-7">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt={getDisplayName()} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{getDisplayName()}</p>
                      <p className="w-[200px] truncate text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span className="text-sm">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search neighborhood..." 
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>
    </header>
    
    {/* Notification Panel */}
    <NotificationPanel 
      isOpen={notificationPanelOpen}
      onClose={() => setNotificationPanelOpen(false)}
      position="top-right"
    />
  </>
  );
};

export default Header;