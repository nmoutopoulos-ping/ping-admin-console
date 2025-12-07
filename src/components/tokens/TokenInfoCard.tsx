import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract } from "@/lib/contractRegistry";
import { readTokenInfo, TokenInfo as TokenInfoType } from "@/lib/onchain";
import { RefreshCw, Loader2, AlertCircle, Coins } from "lucide-react";

interface TokenInfoCardProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function TokenInfoCard({ contract, isWalletConnected }: TokenInfoCardProps) {
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

  const canLoad = contract && isWalletConnected;

  return (
    <div className="console-card h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <h3 className="font-medium">Token Info</h3>
        </div>
        {canLoad && (
          <Button
            variant="ghost"
            size="icon"
            onClick={loadTokenInfo}
            disabled={loading}
            className="h-7 w-7"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {!canLoad ? (
        <p className="text-sm text-muted-foreground">
          {!contract ? "Select a token" : "Connect wallet to view info"}
        </p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      ) : tokenInfo ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="font-medium text-sm">{tokenInfo.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Symbol</p>
            <p className="font-mono font-medium text-sm">{tokenInfo.symbol}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Decimals</p>
            <p className="font-mono text-sm">{tokenInfo.decimals}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Supply</p>
            <p className="font-mono text-sm text-primary">{tokenInfo.totalSupplyFormatted}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
