import React, { useEffect, Suspense, lazy } from "react";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import PlatformRouter from "@/components/PlatformRouter";
import { ThemeProvider } from "next-themes";
import { IOSErrorBoundary } from "@/components/common/IOSErrorBoundary";
import { initializeNativeApp, forceHideSplash, isNativePlatform } from '@/utils/nativeStartup';
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

import { AuthProvider } from "@/hooks/useAuth";
import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
import { CallProvider } from "@/contexts/CallContext";
import NeighborhoodEmergencyAlert from "@/components/NeighborhoodEmergencyAlert";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AudioInitializer } from "@/components/AudioInitializer";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { OnboardingNotificationManager } from "@/components/OnboardingNotificationManager";

import AppTutorial from "@/components/AppTutorial";
import { useTutorial } from "@/hooks/useTutorial";
import MessagingNotificationProvider from "@/components/messaging/MessagingNotificationProvider";
import { useCommunityPostToasts } from "@/hooks/useCommunityPostToasts";
import { useDirectMessageToasts } from "@/hooks/useDirectMessageToasts";
import { useDeepLinkHandler } from "@/hooks/mobile/useDeepLinkHandler";
import { ConnectionStatusIndicator } from "@/components/mobile/ConnectionStatusIndicator";
import { OfflineModeBanner } from "@/components/mobile/OfflineModeBanner";
import { SyncStatusIndicator } from "@/components/mobile/SyncStatusIndicator";
import { CookieConsentBanner, CookieSettingsButton } from "@/components/cookies/CookieConsentBanner";

const Index = lazyWithRetry(() => import("./pages/Index"));
const CreateRecommendation = lazyWithRetry(() => import("./pages/CreateRecommendation"));
const CreateCampaign = lazyWithRetry(() => import("./pages/CreateCampaign"));
const Home = lazyWithRetry(() => import("./pages/Home"));
const Feed = lazyWithRetry(() => import("./pages/Feed"));
const Landing = lazyWithRetry(() => import("./pages/Landing"));
const PlatformRoot = lazyWithRetry(() => import("@/components/PlatformRoot"));
const About = lazyWithRetry(() => import("./pages/About"));
const Community = lazyWithRetry(() => import("./pages/Community"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Chat = lazyWithRetry(() => import("./pages/Chat"));
const MarketplacePage = lazyWithRetry(() => import("./pages/MarketplacePage"));
const Safety = lazyWithRetry(() => import("./pages/Safety"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const UserDirectory = lazyWithRetry(() => import("./pages/UserDirectory"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const Services = lazyWithRetry(() => import("./pages/Services"));
const Events = lazyWithRetry(() => import("./pages/Events"));
const MyServices = lazyWithRetry(() => import("./pages/MyServices"));
const MyGoods = lazyWithRetry(() => import("./pages/MyGoods"));
const MyBookings = lazyWithRetry(() => import("./pages/MyBookings"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const CompleteProfile = lazyWithRetry(() => import("./pages/CompleteProfile"));
const VerifyEmail = lazyWithRetry(() => import("./pages/VerifyEmail"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Business = lazyWithRetry(() => import("./pages/Business"));
const Advertising = lazyWithRetry(() => import("./pages/Advertising"));
const ModeratorDashboard = lazyWithRetry(() => import("./pages/ModeratorDashboard"));
const ManagerDashboard = lazyWithRetry(() => import("./pages/ManagerDashboard"));
const SupportDashboard = lazyWithRetry(() => import("./pages/SupportDashboard"));
const StaffDashboard = lazyWithRetry(() => import("./pages/StaffDashboard"));
const StaffNavigation = lazyWithRetry(() => import("./components/StaffNavigation"));
const StaffLogin = lazyWithRetry(() => import("./pages/StaffLogin"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const CommunityGuidelines = lazyWithRetry(() => import("./pages/CommunityGuidelines"));
const Press = lazyWithRetry(() => import("./pages/Press"));
const Careers = lazyWithRetry(() => import("./pages/Careers"));
const ApiDocs = lazyWithRetry(() => import("./pages/ApiDocs"));
const ApiRequestsAdmin = lazyWithRetry(() => import("./pages/ApiRequestsAdmin"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const ProfileMenu = lazyWithRetry(() => import("./pages/ProfileMenu"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
const PrivacySecurity = lazyWithRetry(() => import("./pages/PrivacySecurity"));
const Recommendations = lazyWithRetry(() => import("./pages/Recommendations"));
const RecommendationDetail = lazyWithRetry(() => import("./pages/RecommendationDetail"));
const PostDetail = lazyWithRetry(() => import("./pages/PostDetail"));
const SearchUsers = lazyWithRetry(() => import("./pages/SearchUsers"));

// REMOVED: Duplicate QueryClient - using the one from main.tsx instead

// Lazy load native push registration component
const NativePushRegistration = lazyWithRetry(() => import('@/components/mobile/NativePushRegistration'));

// Component that initializes push notifications inside AuthProvider
const PushNotificationWrapper = () => {
  usePushNotifications();

  // Only render native push registration on native platforms
  if (!window.Capacitor?.isNativePlatform?.()) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <NativePushRegistration />
    </React.Suspense>
  );
};

// Component that manages the tutorial system
const TutorialWrapper = () => {
  const { isOpen: tutorialOpen, closeTutorial, completeTutorial } = useTutorial();

  return (
    <AppTutorial
      isOpen={tutorialOpen}
      onClose={closeTutorial}
      onComplete={completeTutorial}
    />
  );
};

// Component that shows toast notifications for new community posts
const CommunityPostToastWrapper = () => {
  useCommunityPostToasts();
  return null;
};

// Component that shows toast notifications for new direct messages
const DirectMessageToastWrapper = () => {
  useDirectMessageToasts();
  return null;
};

// Component that handles deep link authentication callbacks on native
const DeepLinkHandler = () => {
  useDeepLinkHandler();
  return null;
};

/**
 * Get timestamp for logging
 */
const getTimestamp = (): string => {
  return new Date().toISOString();
};

const App = () => {
  const mountTimestamp = getTimestamp();
  console.log(`[App ${mountTimestamp}] ========== APP COMPONENT RENDERING ==========`);

  // Safe native initialization with comprehensive error handling
  useEffect(() => {
    const timestamp = getTimestamp();
    console.log(`[App ${timestamp}] useEffect: Starting native initialization check`);

    const initNative = async () => {
      const initTimestamp = getTimestamp();
      try {
        console.log(`[App ${initTimestamp}] Checking if native platform...`);
        if (isNativePlatform()) {
          console.log(`[App ${initTimestamp}] NATIVE platform detected, starting initialization...`);
          const success = await initializeNativeApp();
          console.log(`[App ${getTimestamp()}] Native initialization result: ${success ? 'SUCCESS' : 'FAILED'}`);
        } else {
          console.log(`[App ${initTimestamp}] WEB platform detected, skipping native init`);
        }
      } catch (error) {
        console.error(`[App ${getTimestamp()}] Native initialization error:`, error);
        // Emergency fallback - try to hide splash
        console.log(`[App ${getTimestamp()}] Attempting emergency splash hide...`);
        await forceHideSplash();
      }
    };

    initNative();

    // Safety timeout: force hide splash after 5 seconds if still showing
    console.log(`[App ${timestamp}] Setting 5 second safety timeout for splash hide`);
    const safetyTimeout = setTimeout(() => {
      console.log(`[App ${getTimestamp()}] ⚠️ SAFETY TIMEOUT: forcing splash hide after 5 seconds`);
      forceHideSplash();
    }, 5000);

    return () => {
      console.log(`[App ${getTimestamp()}] Cleanup: clearing safety timeout`);
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Add global error handler for security errors (especially iOS WebSocket issues)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    const handleGlobalError = (event: ErrorEvent) => {
      // Handle dynamic import/chunk load errors
      if (event.message?.includes('Failed to fetch dynamically imported module') ||
        event.message?.includes('Loading chunk')) {
        console.warn('Global ChunkLoadError detected - forcing refresh...');
        window.location.reload();
        return;
      }

      if (event.error?.name === 'SecurityError' || event.message?.includes('SecurityError')) {
        console.warn('Global SecurityError caught (suppressed to prevent crash):', event.error?.message || event.message);

        // On iOS, prevent SecurityErrors from crashing the app
        if (isIOS) {
          event.preventDefault();
          event.stopPropagation();

          // Show a user-friendly toast instead of crashing
          if (event.message?.includes('WebSocket') || event.message?.includes('insecure')) {
            console.log('iOS WebSocket security restriction detected - continuing without realtime features');
          }
        }
        return;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      const reasonMessage = event.reason?.message || '';

      // Handle dynamic import/chunk load errors in promises
      if (reason.includes('Failed to fetch dynamically imported module') ||
        reasonMessage.includes('Failed to fetch dynamically imported module') ||
        reason.includes('Loading chunk') ||
        reasonMessage.includes('Loading chunk')) {
        console.warn('Global Promise ChunkLoadError detected - forcing refresh...');
        window.location.reload();
        return;
      }

      if (reason.includes('SecurityError') || reason.includes('insecure') ||
        reasonMessage.includes('insecure') || reasonMessage.includes('SecurityError')) {
        console.warn('Global SecurityError promise rejection (suppressed):', reasonMessage || reason);

        // On iOS, prevent SecurityErrors from crashing the app
        if (isIOS) {
          event.preventDefault();

          // Log but don't crash
          if (reason.includes('WebSocket') || reasonMessage.includes('WebSocket')) {
            console.log('iOS WebSocket security restriction detected - app will continue without realtime');
          }
        }
        return;
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <IOSErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <TooltipProvider>
            <div style={{ minHeight: '100vh' }}>
              <Toaster />
              <Sonner />
              <PlatformRouter>
                <ScrollToTopOnNavigate />
                <RealtimeProvider>
                  <CallProvider>
                    <PresenceProvider>

                      <AudioInitializer />
                      <OfflineModeBanner showWhenOnline={true} />
                      <SyncStatusIndicator position="bottom-right" />
                      <ConnectionStatusIndicator />
                      <PushNotificationWrapper />
                      <DeepLinkHandler />
                      <SecurityHeaders />
                      <OnboardingNotificationManager />
                      <MessagingNotificationProvider />
                      <TutorialWrapper />
                      <CommunityPostToastWrapper />
                      <DirectMessageToastWrapper />
                      <Suspense fallback={<LoadingSpinner fullScreen />}>
                        <Routes>
                          <Route path="/" element={<PlatformRoot />} />
                          <Route path="/feed" element={<Feed />} />
                          <Route path="/home" element={<Home />} />
                          <Route path="/dashboard" element={<Index />} />
                          <Route path="/landing" element={<Landing />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/community" element={<Community />} />
                          <Route path="/community/post/:id" element={<PostDetail />} />
                          <Route path="/messages" element={<Messages />} />
                          <Route path="/search-users" element={<SearchUsers />} />
                          <Route path="/chat/:conversationId" element={<Chat />} />
                          <Route path="/marketplace" element={<MarketplacePage />} />
                          <Route path="/safety" element={<Safety />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/profile-menu" element={<ProfileMenu />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/privacy-security" element={<PrivacySecurity />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/services" element={<Services />} />
                          <Route path="/users" element={<UserDirectory />} />
                          <Route path="/my-services" element={<MyServices />} />
                          <Route path="/my-goods" element={<MyGoods />} />
                          <Route path="/my-bookings" element={<MyBookings />} />
                          <Route path="/events" element={<Events />} />
                          <Route path="/recommendations" element={<Recommendations />} />
                          <Route path="/recommendations/create" element={<CreateRecommendation />} />
                          <Route path="/recommendations/:id" element={<RecommendationDetail />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/auth/verify-email" element={<VerifyEmail />} />
                          <Route path="/auth/complete-profile" element={<CompleteProfile />} />
                          <Route path="/admin" element={<Admin />} />
                          <Route path="/moderator" element={<ModeratorDashboard />} />
                          <Route path="/manager" element={<ManagerDashboard />} />
                          <Route path="/support" element={<SupportDashboard />} />
                          <Route path="/staff-portal" element={<StaffNavigation />} />
                          <Route path="/staff" element={<StaffDashboard />} />
                          <Route path="/staff-dashboard" element={<StaffDashboard />} />
                          <Route path="/business" element={<Business />} />
                          <Route path="/advertising" element={<Advertising />} />
                          <Route path="/advertising/create" element={<CreateCampaign />} />
                          <Route path="/staff-login" element={<StaffLogin />} />
                          <Route path="/privacy" element={<PrivacyPolicy />} />
                          <Route path="/terms" element={<TermsOfService />} />
                          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
                          <Route path="/press" element={<Press />} />
                          <Route path="/careers" element={<Careers />} />
                          <Route path="/api-docs" element={<ApiDocs />} />
                          <Route path="/admin/api-requests" element={<ApiRequestsAdmin />} />
                          <Route path="/help" element={<HelpCenter />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/blog" element={<Blog />} />
                          <Route path="/blog/:slug" element={<BlogPost />} />
                        </Routes>
                      </Suspense>
                      <NeighborhoodEmergencyAlert position="top-center" />
                      {!isNativePlatform() && (
                        <>
                          <CookieConsentBanner />
                          <CookieSettingsButton />
                        </>
                      )}
                    </PresenceProvider>
                  </CallProvider>
                </RealtimeProvider>
              </PlatformRouter>
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </IOSErrorBoundary>
  );
};

export default App;
