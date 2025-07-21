import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreatePostDialog from './CreatePostDialog';
import { 
  Home, 
  MessageSquare, 
  ShoppingBag, 
  Shield, 
  Calendar,
  Users,
  Plus
} from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home', count: 0, path: '/' },
    { id: 'community', icon: MessageSquare, label: 'Community', count: 5, path: '/community' },
    { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace', count: 0, path: '/marketplace' },
    { id: 'safety', icon: Shield, label: 'Safety', count: 2, path: '/safety' },
    { id: 'events', icon: Calendar, label: 'Events', count: 1, path: '/events' },
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
        <div className="grid grid-cols-4 h-16">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  location.pathname === item.path
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.count > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                      {item.count}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
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