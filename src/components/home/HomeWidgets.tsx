import { useState } from "react";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";
import { SafetyAlertsWidget } from "@/components/home/SafetyAlertsWidget";
import { BusinessCardCTA } from "@/components/home/BusinessCardCTA";
import { DiscoverServices } from "@/components/home/DiscoverServices";
import { MarketplaceHighlights } from "@/components/home/MarketplaceHighlights";
import { QuickPostInput } from "@/components/home/QuickPostInput";
import { EventsNearYouCarousel } from "@/components/home/EventsNearYouCarousel";
import { TrendingPostsCarousel } from "@/components/home/TrendingPostsCarousel";
import CreatePostDialog from "@/components/CreatePostDialog";
import { AdDisplay } from "@/components/advertising/display/AdDisplay";

/**
 * HomeWidgets - Mobile Overview Dashboard
 * Displays all dashboard widgets for mobile users
 */
const HomeWidgets = () => {
  const [createPostOpen, setCreatePostOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        <QuickPostInput onCreatePost={() => setCreatePostOpen(true)} />
        <div className="space-y-4 px-4">
          <EventsNearYouCarousel />
        </div>
      </div>
      
      <TrendingPostsCarousel />
      
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4 px-4">
          <SafetyAlertsWidget />
          <AdDisplay 
            placement="feed" 
            maxAds={2}
            filterType="all"
          />
          <CommunityHighlights />
          <DiscoverServices />
          <AdDisplay 
            placement="feed" 
            maxAds={2}
            filterType="all"
          />
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

export default HomeWidgets;
