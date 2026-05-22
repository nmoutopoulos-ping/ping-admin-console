import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import AssetTokensPage from "./pages/AssetTokensPage";
import RequestsPage from "./pages/RequestsPage";
import WalletDashboardPage from "./pages/WalletDashboardPage";
import WalletTokenDetailPage from "./pages/WalletTokenDetailPage";
import LaunchTokenPage from "./pages/LaunchTokenPage";
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
            <Route path="/asset-tokens" element={<AssetTokensPage />} />
            <Route path="/tokens" element={<Navigate to="/asset-tokens" replace />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/launch" element={<LaunchTokenPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
