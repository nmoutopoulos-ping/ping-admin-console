import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TokenSelector } from "@/components/tokens/TokenSelector";
import { TokenOverview } from "@/components/tokens/TokenOverview";
import { AssetToolsCard } from "@/components/tokens/AssetToolsCard";
import { AdminToolsTabs } from "@/components/tokens/AdminToolsTabs";
import { TrackedContract } from "@/lib/contractRegistry";
import { useContracts } from "@/hooks/useContracts";
import { useWallet } from "@/contexts/WalletContext";
import { useIsContractOwner } from "@/hooks/useIsContractOwner";
import { Loader2 } from "lucide-react";

export default function AssetTokensPage() {
  const { wallet } = useWallet();
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(null);
  const { contracts, loading, error } = useContracts();
  const { isOwner } = useIsContractOwner(selectedContract, wallet?.address ?? null);

  const assetContracts = contracts.filter(c => c.type === "asset");

  useEffect(() => {
    if (assetContracts.length > 0 && !selectedContract) {
      setSelectedContract(assetContracts[0]);
    }
  }, [assetContracts, selectedContract]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Asset Tokens</h1>
          <p className="text-muted-foreground">Manage real-world asset backed tokens</p>
        </header>

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

        {!loading && !error && assetContracts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground border border-dashed border-border/50 rounded-xl">
            No asset tokens found
          </div>
        )}

        {!loading && !error && assetContracts.length > 0 && (
          <div className="space-y-8">
            <TokenSelector 
              contracts={assetContracts}
              selectedContract={selectedContract} 
              onSelect={setSelectedContract} 
            />

            <TokenOverview 
              contract={selectedContract} 
              isWalletConnected={!!wallet} 
            />

            <AdminToolsTabs 
              contract={selectedContract} 
              isWalletConnected={!!wallet} 
            />

            {isOwner && (
              <AssetToolsCard 
                contract={selectedContract} 
                isWalletConnected={!!wallet} 
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
