import { useState, useEffect, useCallback } from "react";
import { TrackedContract, EXPLORER_BASE_URL } from "@/lib/contractRegistry";
import { getTransferHistory, TransferEvent, shortenAddress } from "@/lib/onchain";
import { RefreshCw, Loader2, AlertCircle, ExternalLink, Flame, Coins, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TransactionHistoryProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return "—";
  
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff} secs ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

function EventBadge({ type }: { type: TransferEvent['eventType'] }) {
  const config = {
    Mint: { icon: Coins, className: "bg-green-500/10 text-green-500 border-green-500/30" },
    Burn: { icon: Flame, className: "bg-orange-500/10 text-orange-500 border-orange-500/30" },
    Transfer: { icon: ArrowRightLeft, className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  };
  
  const { icon: Icon, className } = config[type];
  
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {type}
    </Badge>
  );
}

export function TransactionHistory({ contract, isWalletConnected }: TransactionHistoryProps) {
  const [transfers, setTransfers] = useState<TransferEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAsset = contract?.type === "asset";
  const canLoad = contract && isWalletConnected && isAsset;

  const loadData = useCallback(async () => {
    if (!contract || !isWalletConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const history = await getTransferHistory(contract.id);
      setTransfers(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [contract, isWalletConnected]);

  useEffect(() => {
    if (canLoad) {
      loadData();
    } else {
      setTransfers([]);
      setError(null);
    }
  }, [contract?.id, isWalletConnected]);

  if (!canLoad) return null;

  const explorerUrl = `${EXPLORER_BASE_URL}/address/`;
  const txUrl = `${EXPLORER_BASE_URL}/tx/`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Transaction History
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && transfers.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading history...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : transfers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/50 p-8 text-center text-muted-foreground">
          No transactions found
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-2 bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
            <span>Type</span>
            <span>From</span>
            <span>To</span>
            <span>Amount</span>
            <span className="text-right">Time</span>
          </div>
          <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
            {transfers.map((tx, index) => (
              <div 
                key={`${tx.txHash}-${index}`}
                className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-3 items-center hover:bg-secondary/20 transition-colors group"
              >
                <EventBadge type={tx.eventType} />
                
                <div className="min-w-0">
                  {tx.eventType === 'Mint' ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    <a
                      href={`${explorerUrl}${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm hover:text-primary transition-colors truncate block"
                    >
                      {shortenAddress(tx.from)}
                    </a>
                  )}
                </div>
                
                <div className="min-w-0">
                  {tx.eventType === 'Burn' ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    <a
                      href={`${explorerUrl}${tx.to}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm hover:text-primary transition-colors truncate block"
                    >
                      {shortenAddress(tx.to)}
                    </a>
                  )}
                </div>
                
                <span className="font-mono text-sm font-medium">
                  {tx.amount.toLocaleString()}
                </span>
                
                <div className="text-right flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(tx.timestamp)}
                  </span>
                  <a
                    href={`${txUrl}${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
