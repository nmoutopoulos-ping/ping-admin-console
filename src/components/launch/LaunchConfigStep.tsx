import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { TokenTypeSelector } from "./TokenTypeSelector";
import { TokenPreviewCard } from "./TokenPreviewCard";
import type { TokenLaunchConfig } from "@/pages/LaunchTokenPage";

interface Props {
  config: TokenLaunchConfig;
  setConfig: (c: TokenLaunchConfig) => void;
  onNext: () => void;
}

export function LaunchConfigStep({ config, setConfig, onNext }: Props) {
  const navigate = useNavigate();

  const valid =
    config.name.trim().length > 0 &&
    config.symbol.trim().length > 0 &&
    Number(config.initialSupply) > 0;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="space-y-3">
        <Label className="text-sm">Token type</Label>
        <TokenTypeSelector
          value={config.type}
          onChange={(type) =>
            setConfig({ ...config, type, decimals: type === "fiat" ? 18 : 0 })
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="t-name">Token name</Label>
          <Input
            id="t-name"
            placeholder="e.g. 131 5th Avenue"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-sym">Token symbol</Label>
          <Input
            id="t-sym"
            placeholder="e.g. 1315TH"
            value={config.symbol}
            maxLength={10}
            onChange={(e) =>
              setConfig({ ...config, symbol: e.target.value.toUpperCase().slice(0, 10) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-sup">Initial supply</Label>
          <Input
            id="t-sup"
            inputMode="decimal"
            placeholder="e.g. 1000000"
            value={config.initialSupply}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d*\.?\d*$/.test(v)) {
                setConfig({ ...config, initialSupply: v });
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-dec">Decimals</Label>
          <Input
            id="t-dec"
            type="number"
            min={0}
            max={18}
            value={config.decimals}
            onChange={(e) => setConfig({ ...config, decimals: Math.max(0, Math.min(18, Number(e.target.value) || 0)) })}
          />
        </div>
      </div>

      <TokenPreviewCard config={config} />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5" />
        Deploy fee: <span className="text-foreground font-medium">Free (testnet)</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="outline" onClick={() => navigate("/fiat-tokens")}>
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!valid}>
          Review token →
        </Button>
      </div>
    </div>
  );
}
