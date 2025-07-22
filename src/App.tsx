import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Temporarily comment out AuthProvider to isolate the issue
// import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Community from "./pages/Community";
import MarketplacePage from "./pages/MarketplacePage";
import Safety from "./pages/Safety";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Services from "./pages/Services";
import Events from "./pages/Events";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/community" element={<Community />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/services" element={<Services />} />
            <Route path="/events" element={<Events />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
