import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CommunityBoards from '@/components/CommunityBoards';
import CommunityFeed from '@/components/CommunityFeed';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import CreateCommunityAdDialog from '@/components/CreateCommunityAdDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Plus, MessageCircle, Users } from 'lucide-react';

const Community = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");

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
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Community</h1>
              <p className="text-muted-foreground">Connect with your neighborhood</p>
            </div>
            
            {/* Mobile - Icon buttons on same line */}
            <div className="md:hidden flex items-center justify-center gap-2">
              <CreateCommunityAdDialog>
                <Button size="icon" className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300">
                  <Megaphone className="h-4 w-4" />
                </Button>
              </CreateCommunityAdDialog>
              <Button
                variant={activeTab === "feed" ? "default" : "outline"}
                onClick={() => setActiveTab("feed")}
                size="icon"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTab === "boards" ? "default" : "outline"}
                onClick={() => setActiveTab("boards")}
                size="icon"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop - Full layout */}
            <div className="hidden md:flex items-center justify-end">
              <CreateCommunityAdDialog>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300">
                  <Megaphone className="h-4 w-4" />
                  Create Ad
                  <Plus className="h-4 w-4" />
                </Button>
              </CreateCommunityAdDialog>
            </div>
          </div>

          <PaymentStatusHandler />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-2">
              <TabsTrigger value="feed">Community Feed</TabsTrigger>
              <TabsTrigger value="boards">Discussion Boards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="feed" className="mt-6">
              <CommunityFeed />
            </TabsContent>
            
            <TabsContent value="boards" className="mt-6">
              <CommunityBoards />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Community;