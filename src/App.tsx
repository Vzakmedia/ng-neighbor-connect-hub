import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/hooks/useAuth";
import NeighborhoodEmergencyAlert from "@/components/NeighborhoodEmergencyAlert";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { AudioInitializer } from "@/components/AudioInitializer";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { OnboardingNotificationManager } from "@/components/OnboardingNotificationManager";
import AppTutorial from "@/components/AppTutorial";
import { useTutorial } from "@/hooks/useTutorial";
import FloatingCreatePostButton from "@/components/FloatingCreatePostButton";
import MessagingNotificationProvider from "@/components/messaging/MessagingNotificationProvider";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import MarketplacePage from "./pages/MarketplacePage";
import Safety from "./pages/Safety";
import Profile from "./pages/Profile";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

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

const App = () => {
  console.log("App component rendering, React:", React);
  // Push notifications are now handled by PushNotificationWrapper inside AuthProvider
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <AudioInitializer />
          <PushNotificationWrapper />
          <SecurityHeaders />
          <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <OnboardingNotificationManager />
          <MessagingNotificationProvider />
          <TutorialWrapper />
          <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/community" element={<Community />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/safety" element={<Safety />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/services" element={<Services />} />
              <Route path="/my-services" element={<MyServices />} />
              <Route path="/my-goods" element={<MyGoods />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/events" element={<Events />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/complete-profile" element={<CompleteProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/moderator" element={<ModeratorDashboard />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/support" element={<SupportDashboard />} />
          <Route path="/staff" element={<StaffNavigation />} />
          <Route path="/business" element={<Business />} />
          <Route path="/staff-login" element={<StaffLogin />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/press" element={<Press />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/api-docs" element={<ApiDocs />} />
            </Routes>
            <NeighborhoodEmergencyAlert position="top-center" />
            <FloatingCreatePostButton />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
