import { useState, useEffect, useCallback } from "react";
import { TrackedContract } from "@/lib/contractRegistry";
import { 
  readTokenInfo, 
  TokenInfo, 
  getHoldersWithBalances, 
  HoldersResult, 
  shortenAddress, 
  getContractOwner 
} from "@/lib/onchain";
import { RefreshCw, Loader2, AlertCircle, Crown, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TokenOverviewProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function TokenOverview({ contract, isWalletConnected }: TokenOverviewProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [holders, setHolders] = useState<HoldersResult | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const isAsset = contract?.type === "asset";
  const canLoad = contract && isWalletConnected;

  const loadData = useCallback(async () => {
    if (!contract || !isWalletConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const promises: Promise<any>[] = [
        readTokenInfo(contract.id),
        getContractOwner(contract.id),
      ];
      
      // Only fetch holders for asset tokens (fiat contracts don't have this function)
      if (isAsset) {
        promises.push(getHoldersWithBalances(contract.id));
      }

      const results = await Promise.all(promises);
      setTokenInfo(results[0]);
      setOwner(results[1]);
      
      if (isAsset) {
        setHolders(results[2]);
      } else {
        setHolders(null);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [contract, isWalletConnected, isAsset]);

  useEffect(() => {
    if (canLoad) {
      loadData();
    } else {
      setTokenInfo(null);
      setHolders(null);
      setOwner(null);
      setError(null);
    }
  }, [contract?.id, isWalletConnected]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const explorerUrl = "https://sepolia.etherscan.io/address/";

  if (!canLoad) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">
          {!contract ? "Select a token to view details" : "Connect wallet to view token data"}
        </p>
      </div>
    );
  }

  const totalSupply = holders?.balances.reduce((sum, b) => sum + parseInt(b || "0"), 0) || 0;
  const nonZeroHolders = holders?.addresses.filter((_, i) => parseInt(holders.balances[i] || "0") > 0) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {loading && !tokenInfo ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading token data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          ) : tokenInfo ? (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold tracking-tight">{tokenInfo.name}</h2>
                <Badge variant="outline" className="font-mono">
                  {tokenInfo.symbol}
                </Badge>
                <Badge className={isAsset ? "badge-asset" : "badge-fiat"}>
                  {isAsset ? "Asset" : "Fiat"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <a 
                  href={`${explorerUrl}${contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <span className="font-mono">{shortenAddress(contract.address)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {lastUpdated && (
                  <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                )}
              </div>
            </>
          ) : null}
        </div>
        
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

      {/* Stats Grid */}
      {tokenInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="Total Supply" 
            value={`${!isAsset ? "$ " : ""}${parseFloat(tokenInfo.totalSupplyFormatted.replace(/,/g, '')).toLocaleString()}`} 
            highlight 
          />
          <StatCard label="Decimals" value={tokenInfo.decimals.toString()} />
          <StatCard label="Holders" value={nonZeroHolders.length.toString() || "—"} />
          {owner && (
            <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Contract Owner</p>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="font-mono text-sm truncate">{shortenAddress(owner)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Holders Table */}
      {holders && holders.addresses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Holders
          </h3>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 bg-secondary/30 text-xs text-muted-foreground uppercase tracking-wider">
              <span>#</span>
              <span>Address</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Share</span>
            </div>
            <div className="divide-y divide-border/30">
              {holders.addresses
                .map((address, index) => ({
                  address,
                  balance: parseInt(holders.balances[index] || "0"),
                }))
                .filter(holder => holder.balance > 0)
                .sort((a, b) => b.balance - a.balance)
                .map((holder, index) => {
                const { address, balance } = holder;
                const percentage = totalSupply > 0 ? ((balance / totalSupply) * 100) : 0;
                const isContractOwner = owner && address.toLowerCase() === owner.toLowerCase();
                const isCopied = copiedAddress === address;
                
                return (
                  <div 
                    key={address} 
                    className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 items-center hover:bg-secondary/20 transition-colors group"
                  >
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <a
                        href={`${explorerUrl}${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm hover:text-primary transition-colors truncate"
                      >
                        {shortenAddress(address)}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyAddress(address)}
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      {isContractOwner && (
                        <Badge variant="outline" className="text-xs gap-1 py-0 shrink-0">
                          <Crown className="w-3 h-3 text-yellow-500" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    <span className="font-mono text-sm font-medium text-right">
                      {balance.toLocaleString()}
                    </span>
                    <div className="text-right w-20">
                      <div className="text-sm font-mono">{percentage.toFixed(1)}%</div>
                      <div className="h-1 bg-secondary rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {holders && holders.addresses.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-border/50 p-8 text-center text-muted-foreground">
          No token holders found
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono text-lg font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}
