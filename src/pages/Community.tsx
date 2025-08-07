import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CommunityBoards from '@/components/CommunityBoards';
import CommunityFeed from '@/components/CommunityFeed';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import CreateCommunityAdDialog from '@/components/CreateCommunityAdDialog';
import CreatePostDialog from '@/components/CreatePostDialog';
import { AdvertisementDisplay } from '@/components/advertising/AdvertisementDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Plus, MessageCircle, Users } from 'lucide-react';

const Community = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");
  const [createPostOpen, setCreatePostOpen] = useState(false);

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