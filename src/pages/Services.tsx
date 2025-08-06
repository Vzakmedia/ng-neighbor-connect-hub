import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';

const Services = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold">My Services & Goods</h1>
            <p className="text-muted-foreground">Manage your services, goods, and bookings</p>
            
            {/* Mobile layout - stacked buttons */}
            <div className="md:hidden space-y-3 max-w-sm mx-auto mt-8">
              <Button 
                onClick={() => navigate('/my-services')} 
                variant="outline" 
                className="w-full h-16 flex flex-col items-center gap-1"
              >
                <span className="font-semibold">My Services</span>
                <span className="text-xs text-muted-foreground">Manage your services</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/my-goods')} 
                variant="outline" 
                className="w-full h-16 flex flex-col items-center gap-1"
              >
                <span className="font-semibold">My Goods</span>
                <span className="text-xs text-muted-foreground">Manage your goods</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/my-bookings')} 
                variant="outline" 
                className="w-full h-16 flex flex-col items-center gap-1"
              >
                <span className="font-semibold">My Bookings</span>
                <span className="text-xs text-muted-foreground">View your bookings</span>
              </Button>
            </div>

            {/* Desktop layout - grid */}
            <div className="hidden md:grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
              <Button 
                onClick={() => navigate('/my-services')} 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
              >
                <span className="font-semibold">My Services</span>
                <span className="text-sm text-muted-foreground">Manage your services</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/my-goods')} 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
              >
                <span className="font-semibold">My Goods</span>
                <span className="text-sm text-muted-foreground">Manage your goods</span>
              </Button>
              
              <Button 
                onClick={() => navigate('/my-bookings')} 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
              >
                <span className="font-semibold">My Bookings</span>
                <span className="text-sm text-muted-foreground">View your bookings</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Services;