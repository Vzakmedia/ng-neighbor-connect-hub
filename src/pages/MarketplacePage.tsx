import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
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
          {/* Mobile tab buttons */}
          <div className="md:hidden space-y-3 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={activeTab === "marketplace" && marketSubTab === "services" ? "default" : "outline"}
                onClick={() => { setActiveTab("marketplace"); setMarketSubTab("services"); }}
                size={activeTab === "marketplace" && marketSubTab === "services" ? "default" : "icon"}
                className="transition-all duration-200"
              >
                <span className="text-xs">📋</span>
                {activeTab === "marketplace" && marketSubTab === "services" && <span className="ml-2">Services</span>}
              </Button>
              <Button
                variant={activeTab === "marketplace" && marketSubTab === "goods" ? "default" : "outline"}
                onClick={() => { setActiveTab("marketplace"); setMarketSubTab("goods"); }}
                size={activeTab === "marketplace" && marketSubTab === "goods" ? "default" : "icon"}
                className="transition-all duration-200"
              >
                <span className="text-xs">🛍️</span>
                {activeTab === "marketplace" && marketSubTab === "goods" && <span className="ml-2">Goods</span>}
              </Button>
              <Button
                variant={activeTab === "businesses" ? "default" : "outline"}
                onClick={() => setActiveTab("businesses")}
                size={activeTab === "businesses" ? "default" : "icon"}
                className="transition-all duration-200"
              >
                <span className="text-xs">🏢</span>
                {activeTab === "businesses" && <span className="ml-2">Local Businesses</span>}
              </Button>
            </div>
            
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
            {/* Desktop tabs */}
            <div className="hidden md:flex items-center gap-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="marketplace">Services & Goods</TabsTrigger>
                <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
              </TabsList>
              
              {activeTab === 'marketplace' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {marketSubTab === 'services' ? 'Services' : 'Goods'} 
                      {' • '}
                      {viewScope === 'neighborhood' ? 'My City' : 'Entire State'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="z-50 bg-background">
                    <DropdownMenuItem onClick={() => setMarketSubTab('services')}>
                      Services
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMarketSubTab('goods')}>
                      Goods
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setViewScope('neighborhood')}>
                      My City
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewScope('state')}>
                      Entire State
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
