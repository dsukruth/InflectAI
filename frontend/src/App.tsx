import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InflectToastProvider } from "@/components/ui/InflectToast";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import AppResearch from "./pages/AppResearch.tsx";
import AppPortfolio from "./pages/AppPortfolio.tsx";
import AppHome from "./pages/AppHome.tsx";
import Demo from "./pages/Demo.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AuthInit = ({ children }: { children: React.ReactNode }) => {
  useAuth();
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/demo" element={<PageTransition><Demo /></PageTransition>} />
        <Route
          path="/app/home"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition><AppHome /></PageTransition>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/research"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition><AppResearch /></PageTransition>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/portfolio"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PageTransition><AppPortfolio /></PageTransition>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InflectToastProvider>
        <BrowserRouter>
          <AuthInit>
            <AnimatedRoutes />
          </AuthInit>
        </BrowserRouter>
      </InflectToastProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
