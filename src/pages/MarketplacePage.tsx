import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [isBusinessExpanded, setIsBusinessExpanded] = useState(false);

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
          <div className="md:hidden flex flex-col gap-2 mb-6">
            {/* Services & Goods expandable button */}
            <div className="flex flex-col gap-2">
              <Button
                variant={activeTab === "marketplace" ? "default" : "outline"}
                onClick={() => {
                  setActiveTab("marketplace");
                  setIsServicesExpanded(!isServicesExpanded);
                }}
                className="flex items-center justify-between w-full"
              >
                <span>{isServicesExpanded ? "Services & Goods" : "S&G"}</span>
                <ChevronRight 
                  className={`h-4 w-4 transition-transform ${isServicesExpanded ? 'rotate-90' : ''}`} 
                />
              </Button>
              
              {isServicesExpanded && (
                <div className="pl-4 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setActiveTab("marketplace"); setMarketSubTab('services'); }}
                    className="w-full justify-start"
                  >
                    Services
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setActiveTab("marketplace"); setMarketSubTab('goods'); }}
                    className="w-full justify-start"
                  >
                    Goods
                  </Button>
                  <div className="border-t pt-2 space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewScope('neighborhood')}
                      className="w-full justify-start text-xs"
                    >
                      My City
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewScope('state')}
                      className="w-full justify-start text-xs"
                    >
                      Entire State
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Local Businesses expandable button */}
            <Button
              variant={activeTab === "businesses" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("businesses");
                setIsBusinessExpanded(!isBusinessExpanded);
              }}
              className="flex items-center justify-between w-full"
            >
              <span>{isBusinessExpanded ? "Local Businesses" : "BIZ"}</span>
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${isBusinessExpanded ? 'rotate-90' : ''}`} 
              />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-2">
              <TabsTrigger value="marketplace">
                <div className="flex items-center gap-2">
                  <span>Services & Goods</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="inline-flex items-center">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="z-50 bg-background">
                      <DropdownMenuItem onClick={() => { setActiveTab('marketplace'); setMarketSubTab('services'); }}>
                        Services
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setActiveTab('marketplace'); setMarketSubTab('goods'); }}>
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
                </div>
              </TabsTrigger>
              <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
            </TabsList>
            
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
