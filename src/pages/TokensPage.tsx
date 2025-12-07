import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { WalletBar } from "@/components/tokens/WalletBar";
import { TokenSelector } from "@/components/tokens/TokenSelector";
import { TokenInfoCard } from "@/components/tokens/TokenInfoCard";
import { AdminToolsTabs } from "@/components/tokens/AdminToolsTabs";
import { AssetToolsCard } from "@/components/tokens/AssetToolsCard";
import { TrackedContract, TRACKED_CONTRACTS } from "@/lib/contractRegistry";
import { WalletInfo } from "@/lib/onchain";

export default function TokensPage() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(
    TRACKED_CONTRACTS[0]
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Wallet Bar */}
        <WalletBar wallet={wallet} onConnect={setWallet} />

        {/* Token Selector */}
        <TokenSelector selectedContract={selectedContract} onSelect={setSelectedContract} />

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
          <p>
            Update contract addresses in{" "}
            <code className="px-1.5 py-0.5 bg-secondary rounded font-mono">
              src/lib/contractRegistry.ts
            </code>
          </p>
        </footer>
      </div>
    </AppLayout>
  );
}
