import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWallet } from "@/contexts/WalletContext";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Banknote, Building2, RefreshCw, AlertCircle, Check, X, Copy, Globe, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";

type WalletToken = {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  // Platform registration status
  isRegistered: boolean;
  registeredType?: "fiat" | "asset";
  registeredLabel?: string;
};

export default function WalletDashboardPage() {
  const { wallet } = useWallet();
  const { contracts, loading: contractsLoading } = useContracts();
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanWalletTokens = async () => {
    if (!wallet?.address) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get all token balances from wallet using Alchemy
      const { data: balancesData, error: balancesError } = await supabase.functions.invoke('alchemy-rpc', {
        body: { 
          method: 'alchemy_getTokenBalances', 
          params: { address: wallet.address } 
        },
      });

      if (balancesError) throw new Error(balancesError.message);
      if (balancesData?.error) throw new Error(balancesData.error);

      const tokenBalances = balancesData?.result?.tokenBalances || [];

      // Step 2: Get metadata for each token
      const tokensWithMetadata: WalletToken[] = await Promise.all(
        tokenBalances.map(async (token: { contractAddress: string; tokenBalance: string }) => {
          try {
            const { data: metaData, error: metaError } = await supabase.functions.invoke('alchemy-rpc', {
              body: { 
                method: 'alchemy_getTokenMetadata', 
                params: { contractAddress: token.contractAddress } 
              },
            });

            if (metaError || metaData?.error) {
              return null;
            }

            const metadata = metaData?.result || {};
            const decimals = metadata.decimals ?? 18;
            const balanceBigInt = BigInt(token.tokenBalance);
            const balanceFormatted = ethers.formatUnits(balanceBigInt, decimals);

            // Check if registered on platform
            const registeredContract = contracts.find(
              c => c.address.toLowerCase() === token.contractAddress.toLowerCase()
            );

            return {
              contractAddress: token.contractAddress,
              symbol: metadata.symbol || "???",
              name: metadata.name || "Unknown Token",
              decimals,
              balance: balanceBigInt.toString(),
              balanceFormatted,
              isRegistered: !!registeredContract,
              registeredType: registeredContract?.type,
              registeredLabel: registeredContract?.label,
            };
          } catch (err) {
            console.error(`Failed to get metadata for ${token.contractAddress}:`, err);
            return null;
          }
        })
      );

      // Filter out nulls and sort: registered first, then by balance
      const validTokens = tokensWithMetadata
        .filter((t): t is WalletToken => t !== null)
        .sort((a, b) => {
          if (a.isRegistered !== b.isRegistered) return a.isRegistered ? -1 : 1;
          return parseFloat(b.balanceFormatted) - parseFloat(a.balanceFormatted);
        });

      setWalletTokens(validTokens);
    } catch (err) {
      console.error("Failed to scan wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to scan wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wallet?.address && contracts.length >= 0 && !contractsLoading) {
      scanWalletTokens();
    }
  }, [wallet?.address, contracts, contractsLoading]);

  const registeredTokens = walletTokens.filter(t => t.isRegistered);
  const unregisteredTokens = walletTokens.filter(t => !t.isRegistered);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
            <p className="text-muted-foreground">
              {wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "Connect wallet to view balances"}
            </p>
          </div>
          {wallet && (
            <Button
              variant="outline"
              size="sm"
              onClick={scanWalletTokens}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Scan Wallet
            </Button>
          )}
        </div>

        {!wallet ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Connect your MetaMask wallet using the button in the header.
              </p>
            </CardContent>
          </Card>
        ) : loading || contractsLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-6">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : walletTokens.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No ERC20 tokens found in your wallet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Platform Registered Tokens */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold">Registered on Platform</h2>
                <Badge variant="secondary">{registeredTokens.length}</Badge>
              </div>
              {registeredTokens.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-muted-foreground">
                    No registered tokens found in your wallet
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {registeredTokens.map((token) => (
                    <TokenCard key={token.contractAddress} token={token} />
                  ))}
                </div>
              )}
            </div>

            {/* Unregistered Tokens */}
            {unregisteredTokens.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <X className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Not Registered</h2>
                  <Badge variant="outline">{unregisteredTokens.length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {unregisteredTokens.map((token) => (
                    <TokenCard key={token.contractAddress} token={token} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function TokenCard({ token }: { token: WalletToken }) {
  const navigate = useNavigate();

  const formatBalance = (balance: string, decimals: number) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return balance;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    if (decimals === 0) return Math.floor(num).toLocaleString();
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

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
          {token.isRegistered ? (
            <Badge variant={token.registeredType === "fiat" ? "default" : "outline"} className="text-xs shrink-0">
              {token.registeredType === "fiat" ? (
                <><Banknote className="w-3 h-3 mr-1" /> FIAT</>
              ) : (
                <><Building2 className="w-3 h-3 mr-1" /> ASSET</>
              )}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">
              <X className="w-3 h-3 mr-1" /> Not Listed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">
            {formatBalance(token.balanceFormatted, token.decimals)} <span className="text-lg font-medium text-muted-foreground">{token.symbol}</span>
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
