import { useState } from "react";
import { WalletConnection } from "@/components/WalletConnection";
import { ContractSelector } from "@/components/ContractSelector";
import { TokenInfo } from "@/components/TokenInfo";
import { AdminTools } from "@/components/AdminTools";
import { TrackedContract, TRACKED_CONTRACTS } from "@/lib/contractRegistry";
import { WalletInfo } from "@/lib/onchain";
import { Zap } from "lucide-react";

const Index = () => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [selectedContract, setSelectedContract] = useState<TrackedContract | null>(
    TRACKED_CONTRACTS[0]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-primary">
                Ping Admin
              </h1>
              <p className="text-xs text-muted-foreground">
                Asset & Fiat Console
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <WalletConnection wallet={wallet} onConnect={setWallet} />
          
          <ContractSelector
            selectedContract={selectedContract}
            onSelect={setSelectedContract}
          />
          
          <TokenInfo
            contract={selectedContract}
            isWalletConnected={!!wallet}
          />
          
          <AdminTools
            contract={selectedContract}
            isWalletConnected={!!wallet}
          />
        </div>

        {/* Footer hint */}
        <footer className="mt-12 text-center text-xs text-muted-foreground">
          <p>
            Replace contract addresses in{" "}
            <code className="px-1.5 py-0.5 bg-secondary rounded font-mono">
              src/lib/contractRegistry.ts
            </code>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
