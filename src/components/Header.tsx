import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OnlineAvatar from '@/components/OnlineAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import CreateCommunityAdDialog from '@/components/CreateCommunityAdDialog';
import { Bell, Search, Menu, MapPin, User, LogOut, Settings, MessageCircle, Shield, Megaphone, X, Phone, Check, AlertTriangle, MessageSquare } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useReadStatus } from "@/hooks/useReadStatus";
import { supabase } from '@/integrations/supabase/client';
import { createSafeSubscription, cleanupSafeSubscription } from '@/utils/realtimeUtils';
import { playNotification } from '@/utils/audioUtils';
import { useNotifications } from '@/hooks/useSimpleNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const { user, signOut } = useAuth();
  const { profile, getDisplayName, getInitials, getLocation } = useProfile();
  const { unreadCounts } = useReadStatus();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { toast } = useToast();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Notification system is now handled by the unified hook

  // Notification counts are now managed by the unified notification system

  const handleMessagesClick = () => {
    navigate('/messages');
    console.log('Messages icon clicked - count:', unreadCounts.messages);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleContactRequest = async (requestId: string, notificationId: string) => {
    try {
      await supabase
        .from('emergency_contact_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      
      await markAsRead(notificationId);
      
      toast({
        title: "Contact Request Accepted",
        description: "You are now listed as an emergency contact.",
      });
    } catch (error) {
      console.error('Error accepting contact request:', error);
      toast({
        title: "Error",
        description: "Failed to accept contact request.",
        variant: "destructive",
      });
    }
  };

  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    }
  };

  const getNotificationIcon = (type: any) => {
    switch (type) {
      case 'emergency':
      case 'panic_alert':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'contact_request':
        return <Shield className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: any, priority: any, isRead: boolean) => {
    if (isRead) return 'border-muted bg-muted/20';
    
    switch (priority) {
      case 'urgent':
        return 'border-destructive bg-destructive/10';
      case 'high':
        return 'border-warning bg-warning/10';
      default:
        return 'border-primary bg-primary/5';
    }
  };

  const isAdmin = user?.email === 'admin@nextdoor.ng' || user?.email === 'vzakfenwa@gmail.com';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
                alt="NeighborLink Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="font-semibold text-lg text-community-primary">NeighborLink</span>
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
            
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-600">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notification Panel */}
              {isNotificationOpen && (
                <Card className="absolute top-12 right-0 w-80 max-h-96 shadow-xl z-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Notifications
                      {unreadNotifications.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {unreadNotifications.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {unreadNotifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs h-6 px-2"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsNotificationOpen(false)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <ScrollArea className="h-80">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <Bell className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 border-l-4 ${getNotificationColor(notification.type, notification.priority, notification.isRead)} hover:bg-muted/50 transition-colors`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  {getNotificationIcon(notification.type)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium truncate">
                                        {notification.title}
                                      </p>
                                      {notification.priority === 'urgent' && (
                                        <Badge variant="destructive" className="text-xs">
                                          URGENT
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {notification.body}
                                    </p>
                                    {notification.data?.sender_name && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        From: {notification.data.sender_name}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 mt-2">
                                {notification.type === 'contact_request' && notification.data?.request_id && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleContactRequest(notification.data.request_id, notification.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Accept
                                  </Button>
                                )}
                                
                                {notification.data?.sender_phone && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCall(notification.data.sender_phone)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                  </Button>
                                )}
                                
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-6 px-2 text-xs ml-auto"
                                  >
                                    Mark read
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <OnlineAvatar
                      userId={user?.id}
                      src={profile?.avatar_url}
                      fallback={getInitials()}
                      size="md"
                    />
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
                  <CreateCommunityAdDialog>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Megaphone className="mr-2 h-4 w-4" />
                      Create Ad
                    </DropdownMenuItem>
                  </CreateCommunityAdDialog>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
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
            <img 
              src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
              alt="NeighborLink Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="font-semibold text-base text-community-primary">NeighborLink</span>
          </div>
          
          <div className="flex items-center space-x-1">
            
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={handleMessagesClick}>
              <MessageCircle className="h-4 w-4" />
              {unreadCounts.messages > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-green-600">
                  {unreadCounts.messages}
                </Badge>
              )}
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative h-8 w-8" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-red-600">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notification Panel - Mobile */}
              {isNotificationOpen && (
                <Card className="absolute top-10 right-0 w-80 max-h-80 shadow-xl z-50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Notifications
                      {unreadNotifications.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {unreadNotifications.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {unreadNotifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="text-xs h-5 px-1"
                        >
                          Mark all
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsNotificationOpen(false)}
                        className="h-5 w-5"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <ScrollArea className="h-64">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <Bell className="h-6 w-6 mb-2 opacity-50" />
                          <p className="text-xs">No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-2 border-l-4 ${getNotificationColor(notification.type, notification.priority, notification.isRead)} hover:bg-muted/50 transition-colors`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1">
                                  {getNotificationIcon(notification.type)}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                      <p className="text-xs font-medium truncate">
                                        {notification.title}
                                      </p>
                                      {notification.priority === 'urgent' && (
                                        <Badge variant="destructive" className="text-xs h-4">
                                          URGENT
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {notification.body}
                                    </p>
                                    {notification.data?.sender_name && (
                                      <p className="text-xs text-muted-foreground mb-1">
                                        From: {notification.data.sender_name}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1 mt-1">
                                {notification.type === 'contact_request' && notification.data?.request_id && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleContactRequest(notification.data.request_id, notification.id)}
                                    className="h-5 px-2 text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Accept
                                  </Button>
                                )}
                                
                                {notification.data?.sender_phone && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCall(notification.data.sender_phone)}
                                    className="h-5 px-2 text-xs"
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                  </Button>
                                )}
                                
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                    className="h-5 px-2 text-xs ml-auto"
                                  >
                                    Mark read
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 rounded-full">
                    <OnlineAvatar
                      userId={user?.id}
                      src={profile?.avatar_url}
                      fallback={getInitials()}
                      size="sm"
                    />
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
                  <CreateCommunityAdDialog>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Megaphone className="mr-2 h-4 w-4" />
                      <span className="text-sm">Create Ad</span>
                    </DropdownMenuItem>
                  </CreateCommunityAdDialog>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span className="text-sm">Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span className="text-sm">Admin Panel</span>
                    </DropdownMenuItem>
                  )}
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
      </div>
    </header>
    
    {/* Notifications now handled by UnifiedNotificationSystem */}
  </>
  );
};

export default Header;