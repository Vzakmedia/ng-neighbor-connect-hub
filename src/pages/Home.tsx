import { useMobileIcons } from "@/hooks/useMobileIcons";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HomeHero } from "@/components/home/HomeHero";
import { CommunityHighlights } from "@/components/home/CommunityHighlights";
import { SafetyAlertsWidget } from "@/components/home/SafetyAlertsWidget";
import { BusinessCardCTA } from "@/components/home/BusinessCardCTA";
import { DiscoverServices } from "@/components/home/DiscoverServices";
import { QuickActions } from "@/components/home/QuickActions";
import { EventsPreview } from "@/components/home/EventsPreview";
import { MarketplaceHighlights } from "@/components/home/MarketplaceHighlights";
import AuthBackground from "@/components/auth/AuthBackground";

const Home = () => {
  const { shouldUseFilledIcons } = useMobileIcons();
  const { user } = useAuth();

  // Redirect to landing page if not authenticated
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  // Only show this page on mobile/native, redirect desktop users to feed
  if (!shouldUseFilledIcons) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <AuthBackground />
      <div className="max-w-2xl mx-auto relative z-10">
        <HomeHero />
        <div className="space-y-4 px-4">
          <QuickActions />
          <SafetyAlertsWidget />
          <CommunityHighlights />
          <EventsPreview />
          <DiscoverServices />
          <MarketplaceHighlights />
          <div className="md:hidden">
            <BusinessCardCTA />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
