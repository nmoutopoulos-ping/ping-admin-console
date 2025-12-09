import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TokenSelector } from "@/components/tokens/TokenSelector";
import { TokenOverview } from "@/components/tokens/TokenOverview";
import { AdminToolsTabs } from "@/components/tokens/AdminToolsTabs";
import { AssetToolsCard } from "@/components/tokens/AssetToolsCard";
import { TrackedContract } from "@/lib/contractRegistry";
import { useContracts } from "@/hooks/useContracts";
import { useWallet } from "@/contexts/WalletContext";
import { Loader2 } from "lucide-react";

export default function TokensPage() {
  const { wallet } = useWallet();
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(null);
  const { contracts, loading, error } = useContracts();

  useEffect(() => {
    if (contracts.length > 0 && !selectedContract) {
      setSelectedContract(contracts[0]);
    }
  }, [contracts, selectedContract]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
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

        {!loading && !error && (
          <div className="space-y-8">
            <TokenSelector 
              contracts={contracts}
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

            {selectedContract?.type === "asset" && (
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
