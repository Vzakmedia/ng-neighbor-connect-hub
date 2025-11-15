import { HomeHero } from "@/components/home/HomeHero";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";
import { SafetyAlertsWidget } from "@/components/home/SafetyAlertsWidget";
import { BusinessCardCTA } from "@/components/home/BusinessCardCTA";
import { DiscoverServices } from "@/components/home/DiscoverServices";
import { QuickActions } from "@/components/home/QuickActions";
import { EventsPreview } from "@/components/home/EventsPreview";
import { MarketplaceHighlights } from "@/components/home/MarketplaceHighlights";

/**
 * HomeWidgets - Mobile Overview Dashboard
 * Displays all dashboard widgets for mobile users
 */
const HomeWidgets = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        <HomeHero />
        <div className="space-y-4 px-4">
          <QuickActions />
          <SafetyAlertsWidget />
          <CommunityHighlights />
          <EventsPreview />
          <DiscoverServices />
          <MarketplaceHighlights />
          <BusinessCardCTA />
        </div>
      </div>
    </div>
  );
};

export default HomeWidgets;
