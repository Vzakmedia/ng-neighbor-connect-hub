import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
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
          <div className="mb-6">
          </div>
          
          <Tabs defaultValue="businesses" className="w-full">
            {/* Desktop TabsList */}
            <TabsList className="hidden md:grid w-full grid-cols-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-3 flex items-center gap-1 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    My Services & Goods
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
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
              <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
            </TabsList>
            
            {/* Mobile compact buttons */}
            <div className="md:hidden flex gap-2 w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    My Services
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
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
              <Button variant="default" size="sm" className="flex-1 text-xs">
                Local Businesses
              </Button>
            </div>

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