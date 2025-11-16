import { useState } from "react";
import { useMobileIcons } from "@/hooks/useMobileIcons";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HomeHero } from "@/components/home/HomeHero";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";
import { SafetyAlertsWidget } from "@/components/home/SafetyAlertsWidget";
import { BusinessCardCTA } from "@/components/home/BusinessCardCTA";
import { DiscoverServices } from "@/components/home/DiscoverServices";
import { QuickActions } from "@/components/home/QuickActions";
import { MarketplaceHighlights } from "@/components/home/MarketplaceHighlights";
import { QuickPostInput } from "@/components/home/QuickPostInput";
import { EventsNearYouCarousel } from "@/components/home/EventsNearYouCarousel";
import CreatePostDialog from "@/components/CreatePostDialog";

const Home = () => {
  const { shouldUseFilledIcons } = useMobileIcons();
  const { user } = useAuth();
  const [createPostOpen, setCreatePostOpen] = useState(false);

  // Redirect to landing page if not authenticated
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // Only show this page on mobile/native, redirect desktop users to feed
  if (!shouldUseFilledIcons) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        <QuickPostInput onCreatePost={() => setCreatePostOpen(true)} />
        <HomeHero />
        <div className="space-y-4 px-4">
          <EventsNearYouCarousel />
          <QuickActions />
          <SafetyAlertsWidget />
          <CommunityHighlights />
          <DiscoverServices />
          <MarketplaceHighlights />
          <BusinessCardCTA />
        </div>
      </div>
      
      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
      />
    </div>
  );
};

export default Home;
