import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CreatePostDialog from '@/components/CreatePostDialog';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Floating Create Post button shown only on dashboard routes for authenticated users
const FloatingCreatePostButton = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  
  // Only show on dashboard-related routes and for authenticated users
  // Explicitly exclude landing and auth pages
  const isLandingRoute = ['/', '/landing', '/auth', '/about', '/privacy', '/terms', '/community-guidelines', '/press', '/careers', '/api-docs'].includes(location.pathname);
  const isDashboardRoute = ['/dashboard', '/community', '/marketplace', '/safety', '/profile', '/settings', '/services', '/events', '/my-services', '/my-goods', '/my-bookings'].includes(location.pathname);
  
  if (!user || !isDashboardRoute || isLandingRoute) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="md:hidden fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl bg-primary/20 backdrop-blur-md border border-white/20 hover:bg-primary/30 transition-all duration-300 z-50 animate-float"
        aria-label="Create Post"
      >
        <Plus className="h-5 w-5 text-white" />
      </Button>

      <CreatePostDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FloatingCreatePostButton;
