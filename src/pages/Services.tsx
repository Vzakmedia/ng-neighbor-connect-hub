import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
          
          <Tabs defaultValue="my-services" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="my-services">My Services</TabsTrigger>
              <TabsTrigger value="my-goods">My Goods</TabsTrigger>
              <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
            </TabsList>

            <TabsContent value="my-services" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">My Services</h2>
                  <p className="text-muted-foreground">Manage your service offerings</p>
                </div>
                <CreateServiceDialog onServiceCreated={handleServiceCreated} />
              </div>
              <CommunityServices />
            </TabsContent>

            <TabsContent value="my-goods" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">My Goods</h2>
                  <p className="text-muted-foreground">Manage your marketplace items</p>
                </div>
                <CreateMarketplaceItemDialog onItemCreated={handleItemCreated} />
              </div>
              <CommunityServices />
            </TabsContent>

            <TabsContent value="my-bookings" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">My Bookings</h2>
                  <p className="text-muted-foreground">Manage your service bookings and orders</p>
                </div>
              </div>
              <CommunityServices />
            </TabsContent>

            <TabsContent value="businesses" className="mt-6">
              <BusinessListings />
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  );
};

export default Services;