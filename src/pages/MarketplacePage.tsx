import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import Marketplace from '@/components/Marketplace';
import BusinessListings from '@/components/BusinessListings';
import { useAuth } from "@/hooks/useAuth";

const MarketplacePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("marketplace");

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
          <div className="md:hidden flex items-center justify-center gap-2 mb-6">
            <Button
              variant={activeTab === "marketplace" ? "default" : "outline"}
              onClick={() => setActiveTab("marketplace")}
              size="icon"
            >
              <span className="text-xs">S&G</span>
            </Button>
            <Button
              variant={activeTab === "businesses" ? "default" : "outline"}
              onClick={() => setActiveTab("businesses")}
              size="icon"
            >
              <span className="text-xs">BIZ</span>
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-2">
              <TabsTrigger value="marketplace">Services & Goods</TabsTrigger>
              <TabsTrigger value="businesses">Local Businesses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="marketplace" className="mt-6">
              <Marketplace />
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