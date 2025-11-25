import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { IOSErrorBoundary } from "@/components/common/IOSErrorBoundary";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { initializeStatusBar } from '@/hooks/mobile/useNativeStatusBar';

import { AuthProvider } from "@/hooks/useAuth";
import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { RealtimeProvider } from "@/contexts/RealtimeContext";
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

import Index from "./pages/Index";
import CreateRecommendation from "./pages/CreateRecommendation";
import CreateCampaign from "./pages/CreateCampaign";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Landing from "./pages/Landing";
import PlatformRoot from "@/components/PlatformRoot";
import About from "./pages/About";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import MarketplacePage from "./pages/MarketplacePage";
import Safety from "./pages/Safety";
import Profile from "./pages/Profile";
import UserDirectory from "./pages/UserDirectory";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import Events from "./pages/Events";
import MyServices from "./pages/MyServices";
import MyGoods from "./pages/MyGoods";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import CompleteProfile from "./pages/CompleteProfile";
import VerifyEmail from "./pages/VerifyEmail";
import Admin from "./pages/Admin";
import Business from "./pages/Business";
import Advertising from "./pages/Advertising";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import SupportDashboard from "./pages/SupportDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StaffNavigation from "./components/StaffNavigation";
import StaffLogin from "./pages/StaffLogin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import Press from "./pages/Press";
import Careers from "./pages/Careers";
import ApiDocs from "./pages/ApiDocs";
import ApiRequestsAdmin from "./pages/ApiRequestsAdmin";
import HelpCenter from "./pages/HelpCenter";
import BlogPost from "./pages/BlogPost";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import ProfileMenu from "./pages/ProfileMenu";
import Notifications from "./pages/Notifications";
import PrivacySecurity from "./pages/PrivacySecurity";
import Recommendations from "./pages/Recommendations";
import RecommendationDetail from "./pages/RecommendationDetail";
import PostDetail from "./pages/PostDetail";

// REMOVED: Duplicate QueryClient - using the one from main.tsx instead

// Component that initializes push notifications inside AuthProvider
const PushNotificationWrapper = () => {
  usePushNotifications();
  // Native push registration (iOS/Android)
  try {
    const { useNativePushRegistration } = require('@/hooks/mobile/useNativePushRegistration');
    useNativePushRegistration();
  } catch (e) {
    // no-op on web build
  }
  return null;
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

const App = () => {
  console.log("App component rendering, React:", React);
  
  // Hide native splash screen and initialize status bar after React is ready
  useEffect(() => {
    const initializeNative = async () => {
      // Only on native platforms
      if (Capacitor.isNativePlatform()) {
        try {
          // Initialize status bar first
          await initializeStatusBar('light');
          
          // Reduced delay from 1500ms to 300ms for faster perceived load
          await new Promise(resolve => setTimeout(resolve, 300));
          await SplashScreen.hide({
            fadeOutDuration: 300
          });
          console.log('Native splash screen hidden and status bar initialized');
        } catch (error) {
          console.debug('Splash screen already hidden or not available:', error);
        }
      }
    };
    
    initializeNative();
  }, []);
  
  // Add global error handler for security errors (especially iOS WebSocket issues)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    const handleGlobalError = (event: ErrorEvent) => {
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
              <div style={{
                paddingLeft: 'var(--safe-area-left)', 
                paddingRight: 'var(--safe-area-right)',
                paddingBottom: 'var(--safe-area-bottom)'
              }}>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTopOnNavigate />
                  <RealtimeProvider>
                    <PresenceProvider>
          
          <AudioInitializer />
          <PushNotificationWrapper />
          <SecurityHeaders />
          <OnboardingNotificationManager />
          <MessagingNotificationProvider />
          <TutorialWrapper />
          <CommunityPostToastWrapper />
          <DirectMessageToastWrapper />
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
            <NeighborhoodEmergencyAlert position="top-center" />
                    </PresenceProvider>
                  </RealtimeProvider>
                 </BrowserRouter>
              </div>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
    </IOSErrorBoundary>
  );
};

export default App;
