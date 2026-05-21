import { Badge } from "@/components/ui/badge";
import type { TokenLaunchConfig } from "@/pages/LaunchTokenPage";

export function TokenPreviewCard({ config }: { config: TokenLaunchConfig }) {
  const initials = (config.symbol || "??").slice(0, 2).toUpperCase();
  return (
    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold truncate">{config.name || "Untitled token"}</div>
            <span className="text-xs text-muted-foreground font-mono">
              {config.symbol || "—"}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {config.type}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex gap-4">
            <span>Decimals: <span className="text-foreground font-mono">{config.decimals}</span></span>
            <span>Initial supply: <span className="text-foreground font-mono">{config.initialSupply || "0"}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
