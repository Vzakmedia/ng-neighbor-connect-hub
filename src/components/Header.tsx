import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OnlineAvatar from '@/components/OnlineAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import CreateCommunityAdDialog from '@/components/CreateCommunityAdDialog';
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  MapPinIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon, 
  Cog6ToothIcon, 
  ChatBubbleLeftIcon, 
  ShieldCheckIcon, 
  MegaphoneIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useReadStatus } from "@/hooks/useReadStatus";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { NotificationBell } from './notifications/NotificationBell';
import { NotificationPanel } from './notifications/NotificationPanel';

const Header = () => {
  const { user, signOut } = useAuth();
  const { profile, getDisplayName, getInitials, getLocation } = useProfile();
  const { unreadCounts } = useReadStatus();
  const { isAdmin } = useAdminStatus();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleMessagesClick = () => {
    navigate('/messages');
    console.log('Messages icon clicked - count:', unreadCounts.messages);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ paddingTop: 'var(--safe-area-top)' }}>
      {/* Desktop Header */}
      <div className="hidden md:block">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/neighborlink-logo.png" 
                alt="NeighborLink Logo" 
                className="h-10 w-10 rounded-xl object-contain"
              />
              <span className="font-semibold text-lg text-community-primary">NeighborLink</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            <div className="relative w-full max-w-sm">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search neighborhood..." 
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPinIcon className="h-4 w-4" />
              <span>{getLocation()}</span>
            </div>
            
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative" onClick={handleMessagesClick} data-tutorial="messages">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              {unreadCounts.messages > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-600">
                  {unreadCounts.messages}
                </Badge>
              )}
            </Button>
            
            <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-tutorial="profile">
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
                      <MegaphoneIcon className="mr-2 h-4 w-4" />
                      Create Ad
                    </DropdownMenuItem>
                  </CreateCommunityAdDialog>
                  <DropdownMenuItem onClick={() => navigate('/advertising')}>
                    <ChartBarIcon className="mr-2 h-4 w-4" />
                    View Campaigns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Cog6ToothIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <ShieldCheckIcon className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
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
              src="/neighborlink-logo.png" 
              alt="NeighborLink Logo" 
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="font-semibold text-base text-community-primary">NeighborLink</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <Button variant="ghost" size="icon" className="relative h-10 w-10" onClick={handleMessagesClick} data-tutorial="messages">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              {unreadCounts.messages > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-green-600">
                  {unreadCounts.messages}
                </Badge>
              )}
            </Button>
            
            <NotificationBell onClick={() => setShowNotifications(!showNotifications)} className="h-10 w-10" />
          </div>
        </div>
      </div>
    </header>
    
    {/* Notification Panel - shared for both mobile and desktop */}
    {showNotifications && (
      <NotificationPanel 
        onClose={() => setShowNotifications(false)} 
        position="top-right"
      />
    )}
    </>
  );
};

export default Header;
