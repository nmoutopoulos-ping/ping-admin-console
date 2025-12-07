import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WalletBar } from "@/components/tokens/WalletBar";
import { TokenSelector } from "@/components/tokens/TokenSelector";
import { TokenInfoCard } from "@/components/tokens/TokenInfoCard";
import { AdminToolsTabs } from "@/components/tokens/AdminToolsTabs";
import { AssetToolsCard } from "@/components/tokens/AssetToolsCard";
import { TrackedContract } from "@/lib/contractRegistry";
import { WalletInfo } from "@/lib/onchain";
import { useContracts } from "@/hooks/useContracts";
import { Loader2 } from "lucide-react";

export default function TokensPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(null);
  const { contracts, loading, error } = useContracts();

  // Auto-select first contract when loaded
  useEffect(() => {
    if (contracts.length > 0 && !selectedContract) {
      setSelectedContract(contracts[0]);
    }
  }, [contracts, selectedContract]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Wallet Bar */}
        <WalletBar wallet={wallet} onConnect={setWallet} />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading contracts...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Token Selector */}
            <TokenSelector 
              contracts={contracts}
              selectedContract={selectedContract} 
              onSelect={setSelectedContract} 
            />

            {/* Token Info + Admin Tools */}
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <TokenInfoCard contract={selectedContract} isWalletConnected={!!wallet} />
              <AdminToolsTabs contract={selectedContract} isWalletConnected={!!wallet} />
            </div>

            {/* Asset Token Tools (only for asset tokens) */}
            {selectedContract?.type === "asset" && (
              <AssetToolsCard contract={selectedContract} isWalletConnected={!!wallet} />
            )}

            {/* Footer hint */}
            <footer className="text-center text-xs text-muted-foreground pt-4">
              <p>Contracts are stored in your database. Add more via the backend.</p>
            </footer>
          </>
        )}
      </div>
    </AppLayout>
  );
}
