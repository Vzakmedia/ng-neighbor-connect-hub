import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import CommunityBoards from '@/components/CommunityBoards';
import CommunityFeed from '@/components/CommunityFeed';
import PaymentStatusHandler from '@/components/PaymentStatusHandler';
import CreateCommunityAdDialog from '@/components/CreateCommunityAdDialog';
import CreatePostDialog from '@/components/CreatePostDialog';
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
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Mobile - Header with icons on same line */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Community</h1>
                <div className="flex items-center gap-2">
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
              </div>
              <p className="text-muted-foreground text-left">Connect with your neighborhood</p>
            </div>

            {/* Desktop - Original layout */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold">Community</h1>
              <p className="text-muted-foreground">Connect with your neighborhood</p>
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

      {/* Floating Create Post Button */}
      <Button
        onClick={() => setCreatePostOpen(true)}
        size="icon"
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary transition-all duration-300 z-50"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </div>
  );
};

export default Community;