import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, X, Copy, Globe, ChevronRight, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatTokenBalance } from "@/lib/formatters";

export type WalletToken = {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  isRegistered: boolean;
  registeredType?: "asset";
  registeredLabel?: string;
};

interface TokenCardProps {
  token: WalletToken;
  onHide?: (address: string, e: React.MouseEvent) => void;
  isHidden?: boolean;
}

export function TokenCard({ token, onHide, isHidden }: TokenCardProps) {
  const navigate = useNavigate();

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.contractAddress);
    toast.success("Contract address copied!");
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow cursor-pointer ${token.isRegistered ? "" : "opacity-75"}`}
      onClick={() => navigate(`/wallet/${token.contractAddress}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">
            {token.isRegistered ? token.registeredLabel : token.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            {!token.isRegistered && onHide && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={(e) => onHide(token.contractAddress, e)}
                title={isHidden ? "Unhide token" : "Hide token"}
              >
                {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </Button>
            )}
            {token.isRegistered ? (
              <Badge variant="outline" className="text-xs shrink-0">
                <Shield className="w-3 h-3 mr-1" /> PRIVATE SECURITY
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs shrink-0">
                <X className="w-3 h-3 mr-1" /> Not Listed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">
            {formatTokenBalance(token.balanceFormatted, token.decimals)} <span className="text-lg font-medium text-muted-foreground">{token.symbol}</span>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {/* Network Badge */}
        <div className="flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sepolia Testnet</span>
        </div>
        
        {/* Full Contract Address */}
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <code className="text-xs font-mono text-foreground break-all flex-1 select-all">
            {token.contractAddress}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={copyAddress}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
