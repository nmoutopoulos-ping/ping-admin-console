import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle, Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { connectWallet, shortenAddress } from "@/lib/onchain";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HeaderWallet() {
  const { wallet, setWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adminAddresses, setAdminAddresses] = useState<string[]>([]);

  useEffect(() => {
    const fetchAdminWallets = async () => {
      const { data } = await supabase.from("admin_wallets").select("wallet_address");
      if (data) {
        setAdminAddresses(data.map((w) => w.wallet_address.toLowerCase()));
      }
    };
    fetchAdminWallets();
  }, []);

  const isAdminWallet = wallet && adminAddresses.includes(wallet.address.toLowerCase());

  const handleConnect = async () => {
    setLoading(true);
    try {
      const walletInfo = await connectWallet();
      setWallet(walletInfo);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
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

  if (wallet) {
    return (
      <div className="flex items-center gap-2">
        {!isAdminWallet && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500 hidden sm:inline">Not Admin</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Connected wallet is not a registered admin</p>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/20 border border-primary/30 rounded-full">
          <CheckCircle className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-primary hidden sm:inline">Connected</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={copyAddress}
              className="flex items-center gap-2 px-2 py-1 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
            >
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono text-xs">{shortenAddress(wallet.address)}</span>
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
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={handleConnect} disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">Connect Wallet</span>
    </Button>
  );
}
