/**
 * App — root component and boot orchestrator.
 *
 * Boot sequence:
 * 1. SplashScreen displays for ~1.8s (branding moment)
 * 2. Auth gate checks localStorage for a session token
 *    - No session → redirect to /auth
 *    - Session found (or IS_DEVELOPER flag) → render main app
 * 3. Main app renders Index which handles tab navigation
 *
 * Why Sonner only (no Radix Toaster)?
 * The app standardised on Sonner for all toast notifications.
 * The Radix toast system was unused and has been removed.
 */

import { useState, useCallback } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { IS_DEVELOPER } from "@/lib/constants";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [authenticated, setAuthenticated] = useState(
    IS_DEVELOPER || !!localStorage.getItem("mn_session")
  );

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);
  const handleAuthenticated = useCallback(() => setAuthenticated(true), []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                authenticated ? (
                  <Index />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/auth"
              element={
                authenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <Auth onAuthenticated={handleAuthenticated} />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
