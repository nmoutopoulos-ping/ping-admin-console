import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WalletBar } from "@/components/tokens/WalletBar";
import { TokenSelector } from "@/components/tokens/TokenSelector";
import { TokenOverview } from "@/components/tokens/TokenOverview";
import { FiatAdminTools } from "@/components/tokens/FiatAdminTools";
import { TrackedContract } from "@/lib/contractRegistry";
import { WalletInfo } from "@/lib/onchain";
import { useContracts } from "@/hooks/useContracts";
import { Loader2 } from "lucide-react";

export default function FiatTokensPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(null);
  const { contracts, loading, error } = useContracts();

  const fiatContracts = contracts.filter(c => c.type === "fiat");

  useEffect(() => {
    if (fiatContracts.length > 0 && !selectedContract) {
      setSelectedContract(fiatContracts[0]);
    }
  }, [fiatContracts, selectedContract]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Fiat Tokens</h1>
          <p className="text-muted-foreground">Manage stablecoin and fiat-backed tokens</p>
        </header>

        <WalletBar wallet={wallet} onConnect={setWallet} />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {!loading && !error && fiatContracts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
            No fiat tokens found
          </div>
        )}

        {!loading && !error && fiatContracts.length > 0 && (
          <div className="space-y-8">
            <TokenSelector 
              contracts={fiatContracts}
              selectedContract={selectedContract} 
              onSelect={setSelectedContract} 
            />

            <TokenOverview 
              contract={selectedContract} 
              isWalletConnected={!!wallet} 
            />

            <FiatAdminTools 
              contract={selectedContract} 
              isWalletConnected={!!wallet} 
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
