import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/hooks/useAuth";
import NeighborhoodEmergencyAlert from "@/components/NeighborhoodEmergencyAlert";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Community from "./pages/Community";
import Messages from "./pages/Messages";
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
import Admin from "./pages/Admin";
import Business from "./pages/Business";
import ModeratorDashboard from "./pages/ModeratorDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import SupportDashboard from "./pages/SupportDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import StaffNavigation from "./components/StaffNavigation";
import StaffLogin from "./pages/StaffLogin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  console.log("App component rendering, React:", React);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <SecurityHeaders />
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/community" element={<Community />} />
              <Route path="/messages" element={<Messages />} />
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/moderator" element={<ModeratorDashboard />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/support" element={<SupportDashboard />} />
          <Route path="/staff" element={<StaffNavigation />} />
          <Route path="/business" element={<Business />} />
          <Route path="/staff-login" element={<StaffLogin />} />
            </Routes>
            <NeighborhoodEmergencyAlert position="top-center" />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
