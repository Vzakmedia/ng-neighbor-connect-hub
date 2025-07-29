import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CreateServiceDialog from '@/components/CreateServiceDialog';
import CreateMarketplaceItemDialog from '@/components/CreateMarketplaceItemDialog';
import ServicesList from '@/components/ServicesList';
import BusinessListings from '@/components/BusinessListings';
import CommunityServices from '@/components/CommunityServices';

const Services = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [myServicesDialogOpen, setMyServicesDialogOpen] = useState(false);
  const [myServicesTab, setMyServicesTab] = useState('my-services');

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
          
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">Services</TabsTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-3 flex items-center gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    My Services & Goods
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => {
                    setMyServicesTab('my-services');
                    setMyServicesDialogOpen(true);
                  }}>
                    My Services
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setMyServicesTab('my-goods');
                    setMyServicesDialogOpen(true);
                  }}>
                    My Goods
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setMyServicesTab('my-bookings');
                    setMyServicesDialogOpen(true);
                  }}>
                    My Bookings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-6">
              <CommunityServices />
            </TabsContent>

            <TabsContent value="businesses" className="mt-6">
              <BusinessListings />
            </TabsContent>
          </Tabs>

          {/* My Services & Goods Dialog */}
          <Dialog open={myServicesDialogOpen} onOpenChange={setMyServicesDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>
                  {myServicesTab === 'my-services' && 'My Services'}
                  {myServicesTab === 'my-goods' && 'My Goods'}
                  {myServicesTab === 'my-bookings' && 'My Bookings'}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto">
                <ServicesList onRefresh={refreshTrigger} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Services;