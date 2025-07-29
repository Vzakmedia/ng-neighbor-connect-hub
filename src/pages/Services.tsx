import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CreateServiceDialog from '@/components/CreateServiceDialog';
import CreateMarketplaceItemDialog from '@/components/CreateMarketplaceItemDialog';
import BusinessListings from '@/components/BusinessListings';
import CommunityServices from '@/components/CommunityServices';

const Services = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleServiceCreated = () => {
    setRefreshTrigger(prev => !prev);
  };

  const handleItemCreated = () => {
    setRefreshTrigger(prev => !prev);
  };

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
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Services & Goods</h1>
            <div className="flex gap-2">
              <CreateServiceDialog onServiceCreated={handleServiceCreated} />
              <CreateMarketplaceItemDialog onItemCreated={handleItemCreated} />
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  My Services & Goods
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/my-services')}>
                  My Services
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-goods')}>
                  My Goods
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
                  My Bookings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Local Businesses</h2>
            <BusinessListings />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Services;