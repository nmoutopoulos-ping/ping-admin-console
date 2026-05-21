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
import NotFound from "./pages/NotFound";

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
            <Route path="/wallet" element={<WalletDashboardPage />} />
            <Route path="/wallet/:contractAddress" element={<WalletTokenDetailPage />} />
            <Route path="/fiat-tokens" element={<FiatTokensPage />} />
            <Route path="/asset-tokens" element={<AssetTokensPage />} />
            <Route path="/tokens" element={<Navigate to="/fiat-tokens" replace />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
