import { Info, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { connectWallet } from "@/lib/onchain";
import type { TokenLaunchConfig } from "@/pages/LaunchTokenPage";

interface Props {
  config: TokenLaunchConfig;
  onBack: () => void;
  onDeploy: () => void;
}

export function LaunchReviewStep({ config, onBack, onDeploy }: Props) {
  const { wallet, setWallet } = useWallet();

  const rows: [string, string][] = [
    ["Token name", config.name],
    ["Symbol", config.symbol],
    ["Type", config.type === "fiat" ? "Fiat / Stablecoin" : "Asset / Security"],
    ["Decimals", String(config.decimals)],
    ["Initial supply", config.initialSupply],
    ["Owner", wallet?.address ?? "—"],
    ["Network", "Sepolia"],
    ["Deploy fee", "Free (testnet)"],
  ];

  const handleConnect = async () => {
    try {
      const info = await connectWallet();
      setWallet(info);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{k}</div>
            <div className="text-sm font-mono text-foreground truncate max-w-[60%] text-right">
              {v || "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <span>
          Once deployed, the token contract is permanent and you will be the owner. You
          can mint, burn, and transfer tokens after deployment.
        </span>
      </div>

      {!wallet && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs text-warning">
          <WalletIcon className="w-4 h-4" />
          Connect your wallet to deploy
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        {wallet ? (
          <Button onClick={onDeploy}>Deploy token</Button>
        ) : (
          <Button onClick={handleConnect}>
            <WalletIcon className="w-4 h-4" /> Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
}
