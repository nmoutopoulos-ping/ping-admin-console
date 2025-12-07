import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WalletBar } from "@/components/tokens/WalletBar";
import { TokenSelector } from "@/components/tokens/TokenSelector";
import { TokenInfoCard } from "@/components/tokens/TokenInfoCard";
import { FiatAdminTools } from "@/components/tokens/FiatAdminTools";
import { TrackedContract } from "@/lib/contractRegistry";
import { WalletInfo } from "@/lib/onchain";
import { useContracts } from "@/hooks/useContracts";
import { Loader2 } from "lucide-react";

export default function FiatTokensPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(null);
  const { contracts, loading, error } = useContracts();

  // Filter only fiat contracts
  const fiatContracts = contracts.filter(c => c.type === "fiat");

  // Auto-select first fiat contract when loaded
  useEffect(() => {
    if (fiatContracts.length > 0 && !selectedContract) {
      setSelectedContract(fiatContracts[0]);
    }
  }, [fiatContracts, selectedContract]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fiat Tokens</h1>
            <p className="text-sm text-muted-foreground">Manage stablecoin and fiat-backed tokens</p>
          </div>
        </div>

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

        {/* No Fiat Contracts */}
        {!loading && !error && fiatContracts.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
            No fiat tokens found in the database.
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && fiatContracts.length > 0 && (
          <>
            {/* Token Selector */}
            <TokenSelector 
              contracts={fiatContracts}
              selectedContract={selectedContract} 
              onSelect={setSelectedContract} 
            />

            {/* Token Info + Admin Tools */}
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <TokenInfoCard contract={selectedContract} isWalletConnected={!!wallet} />
              <FiatAdminTools contract={selectedContract} isWalletConnected={!!wallet} />
            </div>

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
