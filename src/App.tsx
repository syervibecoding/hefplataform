import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import PublicSupportPortal from "./pages/PublicSupportPortal";
import ClientPortalPage from "./pages/ClientPortalPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function AuthGate() {
  const { user, loading, role, isCliente } = useAuth();

  if (loading || (user && !role)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (isCliente) {
    return (
      <Routes>
        <Route path="/" element={<ClientPortalPage />} />
        <Route path="*" element={<ClientPortalPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/suporte/p/:slug" element={<PublicSupportPortal />} />
            <Route path="*" element={<AuthGate />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
