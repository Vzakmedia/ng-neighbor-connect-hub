import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CreatePostDialog from './CreatePostDialog';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useReadStatus } from '@/hooks/useReadStatus';
import { 
  Home, 
  MessageSquare, 
  MessageCircle,
  ShoppingBag, 
  Shield, 
  Calendar,
  Users,
  Plus,
  UserCheck
} from 'lucide-react';

const Navigation = () => {
  const { unreadCounts } = useReadStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const unreadMessagesCount = useUnreadMessages();
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', count: 0, path: '/' },
    { id: 'community', icon: MessageSquare, label: 'Community', count: unreadCounts.community, path: '/community' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', count: unreadCounts.messages, path: '/messages' },
    { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'safety', icon: Shield, label: 'Safety', count: 0, path: '/safety' },
    { id: 'contacts', icon: UserCheck, label: 'Contacts', count: 0, path: '/contacts' },
    { id: 'events', icon: Calendar, label: 'Events', count: 0, path: '/events' },
    { id: 'services', icon: Users, label: 'Services', count: 0, path: '/services' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 bg-card border-r">
        <div className="flex-1 flex flex-col min-h-0 pt-4">
          <div className="px-4 mb-4">
            <Button 
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => setCreatePostOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </div>
          
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50">
        <div className="flex h-16">
          {/* Main nav items - 4 columns */}
          <div className="flex-1 grid grid-cols-4">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
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
                  <span className="text-xs font-medium">{item.label}</span>
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
                {navItems.slice(4).map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
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
                <DropdownMenuItem 
                  onClick={() => setCreatePostOpen(true)}
                  className="flex items-center py-3 text-primary"
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