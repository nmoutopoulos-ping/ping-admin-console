import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { connectWallet, WalletInfo, shortenAddress } from "@/lib/onchain";

interface WalletConnectionProps {
  wallet: WalletInfo | null;
  onConnect: (wallet: WalletInfo) => void;
}

export function WalletConnection({ wallet, onConnect }: WalletConnectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const walletInfo = await connectWallet();
      onConnect(walletInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="console-card animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Wallet Connection</h2>
      </div>

      {wallet ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
              <p className="address-display">{shortenAddress(wallet.address)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Chain ID</p>
              <p className="address-display">{wallet.chainId}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono break-all mt-2">
            {wallet.address}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your MetaMask wallet to interact with contracts.
          </p>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <Button 
            onClick={handleConnect} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Connect MetaMask
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
