import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import FiatTokensPage from "./pages/FiatTokensPage";
import AssetTokensPage from "./pages/AssetTokensPage";
import RequestsPage from "./pages/RequestsPage";
import WalletDashboardPage from "./pages/WalletDashboardPage";
import WalletTokenDetailPage from "./pages/WalletTokenDetailPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/wallet" element={<ProtectedRoute><WalletDashboardPage /></ProtectedRoute>} />
            <Route path="/wallet/:contractAddress" element={<ProtectedRoute><WalletTokenDetailPage /></ProtectedRoute>} />
            <Route path="/fiat-tokens" element={<ProtectedRoute><FiatTokensPage /></ProtectedRoute>} />
            <Route path="/asset-tokens" element={<ProtectedRoute><AssetTokensPage /></ProtectedRoute>} />
            <Route path="/tokens" element={<Navigate to="/fiat-tokens" replace />} />
            <Route path="/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
