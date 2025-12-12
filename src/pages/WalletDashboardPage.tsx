import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWallet } from "@/contexts/WalletContext";
import { useContracts } from "@/hooks/useContracts";
import { getTokenBalance, readTokenInfo, TokenInfo, BalanceResult } from "@/lib/onchain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Banknote, Building2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type TokenBalanceData = {
  contractId: string;
  label: string;
  type: "fiat" | "asset";
  symbol: string;
  balance: string;
  isRegistered: boolean;
};

export default function WalletDashboardPage() {
  const { wallet } = useWallet();
  const { contracts, loading: contractsLoading } = useContracts();
  const [balances, setBalances] = useState<TokenBalanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    if (!wallet?.address || contracts.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        contracts.map(async (contract) => {
          try {
            const [tokenInfo, balanceResult] = await Promise.all([
              readTokenInfo(contract.id),
              getTokenBalance(contract.id, wallet.address),
            ]);

            return {
              contractId: contract.id,
              label: contract.label,
              type: contract.type,
              symbol: tokenInfo.symbol,
              balance: balanceResult.formatted,
              isRegistered: true,
            };
          } catch (err) {
            console.error(`Failed to fetch ${contract.id}:`, err);
            return {
              contractId: contract.id,
              label: contract.label,
              type: contract.type,
              symbol: contract.id,
              balance: "Error",
              isRegistered: true,
            };
          }
        })
      );

      setBalances(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [wallet?.address, contracts]);

  const fiatTokens = balances.filter((b) => b.type === "fiat");
  const assetTokens = balances.filter((b) => b.type === "asset");

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Wallet Dashboard</h1>
            <p className="text-muted-foreground">
              {wallet ? `Connected: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Connect your wallet to view balances"}
            </p>
          </div>
          {wallet && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBalances}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        {!wallet ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Connect your wallet using the button in the header to view your token balances.
              </p>
            </CardContent>
          </Card>
        ) : contractsLoading || loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Fiat Tokens Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Fiat Tokens</h2>
                <Badge variant="secondary">{fiatTokens.length}</Badge>
              </div>
              {fiatTokens.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No fiat tokens registered on platform
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {fiatTokens.map((token) => (
                    <TokenBalanceCard key={token.contractId} token={token} />
                  ))}
                </div>
              )}
            </div>

            {/* Asset Tokens Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Asset Tokens</h2>
                <Badge variant="secondary">{assetTokens.length}</Badge>
              </div>
              {assetTokens.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No asset tokens registered on platform
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assetTokens.map((token) => (
                    <TokenBalanceCard key={token.contractId} token={token} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function TokenBalanceCard({ token }: { token: TokenBalanceData }) {
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{token.label}</CardTitle>
          <Badge variant={token.type === "fiat" ? "default" : "outline"} className="text-xs">
            {token.type.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            {formatBalance(token.balance)}
          </span>
          <span className="text-sm text-muted-foreground">{token.symbol}</span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Registered on platform</span>
        </div>
      </CardContent>
    </Card>
  );
}
