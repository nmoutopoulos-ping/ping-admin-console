import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract } from "@/lib/contractRegistry";
import { readTokenInfo, TokenInfo as TokenInfoType } from "@/lib/onchain";
import { Info, RefreshCw, Loader2, AlertCircle, Coins } from "lucide-react";

interface TokenInfoProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function TokenInfo({ contract, isWalletConnected }: TokenInfoProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfoType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokenInfo = async () => {
    if (!contract || !isWalletConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await readTokenInfo(contract.id);
      setTokenInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load token info");
      setTokenInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && isWalletConnected) {
      loadTokenInfo();
    } else {
      setTokenInfo(null);
      setError(null);
    }
  }, [contract?.id, isWalletConnected]);

  return (
    <div className="console-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Coins className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Token Info</h2>
        </div>
        {contract && isWalletConnected && (
          <Button
            variant="ghost"
            size="icon"
            onClick={loadTokenInfo}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {!contract ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Info className="w-4 h-4" />
          <span>Select a contract to view token info</span>
        </div>
      ) : !isWalletConnected ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Info className="w-4 h-4" />
          <span>Connect your wallet to load token info</span>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading token info...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : tokenInfo ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="font-medium">{tokenInfo.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Symbol</p>
            <p className="font-mono font-medium">{tokenInfo.symbol}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Decimals</p>
            <p className="font-mono">{tokenInfo.decimals}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Supply</p>
            <p className="font-mono text-primary">{tokenInfo.totalSupplyFormatted}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
