import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ShoppingBag, Briefcase, MapPin, Globe } from '@/lib/icons';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Marketplace from '@/components/Marketplace';
import BusinessListings from '@/components/BusinessListings';
import { useAuth } from "@/hooks/useAuth";

const MarketplacePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("marketplace");
  const [marketSubTab, setMarketSubTab] = useState<'services' | 'goods'>('services');
  const [viewScope, setViewScope] = useState<'neighborhood' | 'state'>('neighborhood');

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
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-16 lg:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          {/* Mobile tab navigation */}
          <div className="md:hidden space-y-3 mb-6">
            <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-muted/30">
              <TabsTrigger 
                value="marketplace"
                onClick={() => setMarketSubTab("services")}
                className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-xs">Services</span>
              </TabsTrigger>
              <TabsTrigger 
                value="marketplace"
                onClick={() => setMarketSubTab("goods")}
                className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="text-xs">Goods</span>
              </TabsTrigger>
              <TabsTrigger 
                value="businesses"
                className="flex flex-col items-center gap-1.5 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <MapPin className="h-5 w-5" />
                <span className="text-xs">Businesses</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Location scope toggle for mobile - only show when on marketplace tab */}
            {activeTab === 'marketplace' && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant={viewScope === 'neighborhood' ? 'default' : 'outline'}
                  onClick={() => setViewScope('neighborhood')}
                  size="sm"
                  className="transition-all duration-200"
                >
                  My City
                </Button>
                <Button
                  variant={viewScope === 'state' ? 'default' : 'outline'}
                  onClick={() => setViewScope('state')}
                  size="sm"
                  className="transition-all duration-200"
                >
                  Entire State
                </Button>
              </div>
            )}
          </div>
          

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop navigation with inline filters */}
            <div className="hidden md:flex items-center gap-6 mb-6 flex-wrap">
              {/* Main Tabs */}
              <TabsList className="flex">
                <TabsTrigger value="marketplace">Services & Goods</TabsTrigger>
                <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
              </TabsList>
              
              {/* Inline Filter Pills - Only show when on marketplace tab */}
              {activeTab === 'marketplace' && (
                <>
                  {/* Vertical Divider */}
                  <div className="h-8 w-px bg-border" />
                  
                  {/* Type Filter: Services/Goods */}
                  <ToggleGroup 
                    type="single" 
                    value={marketSubTab} 
                    onValueChange={(value) => value && setMarketSubTab(value as 'services' | 'goods')}
                    className="border rounded-lg p-1 bg-muted/30"
                  >
                    <ToggleGroupItem 
                      value="services" 
                      aria-label="Services"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Services
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="goods" 
                      aria-label="Goods"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Goods
                    </ToggleGroupItem>
                  </ToggleGroup>
                  
                  {/* Location Filter: My City/Entire State */}
                  <ToggleGroup 
                    type="single" 
                    value={viewScope} 
                    onValueChange={(value) => value && setViewScope(value as 'neighborhood' | 'state')}
                    className="border rounded-lg p-1 bg-muted/30"
                  >
                    <ToggleGroupItem 
                      value="neighborhood" 
                      aria-label="My City"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      My City
                    </ToggleGroupItem>
                    <ToggleGroupItem 
                      value="state" 
                      aria-label="Entire State"
                      className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Entire State
                    </ToggleGroupItem>
                  </ToggleGroup>
                </>
              )}
            </div>
            
            <TabsContent value="marketplace" className="mt-6">
              <Marketplace activeSubTab={marketSubTab} locationScope={viewScope} />
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

export default MarketplacePage;
