import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle, Loader2, Copy, Check } from "lucide-react";
import { connectWallet, WalletInfo, shortenAddress } from "@/lib/onchain";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WalletBarProps {
  wallet: WalletInfo | null;
  onConnect: (wallet: WalletInfo) => void;
}

export function WalletBar({ wallet, onConnect }: WalletBarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const walletInfo = await connectWallet();
      onConnect(walletInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="console-card p-3 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {wallet ? (
          <>
            {/* Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/30 rounded-full">
                <CheckCircle className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">Connected</span>
              </div>
            </div>

            {/* Address */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono text-sm">{shortenAddress(wallet.address)}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs">{wallet.address}</p>
              </TooltipContent>
            </Tooltip>

            {/* Chain ID */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Chain ID:</span>
              <span className="font-mono bg-secondary/50 px-2 py-0.5 rounded">{wallet.chainId}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 w-full justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded-full">
                <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                <span className="text-xs font-medium text-muted-foreground">Disconnected</span>
              </div>
              {error && <span className="text-xs text-destructive">{error}</span>}
            </div>
            <Button size="sm" onClick={handleConnect} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              Connect Wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
