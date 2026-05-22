import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWallet } from "@/contexts/WalletContext";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, RefreshCw, AlertCircle, Check, X, EyeOff, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TokenCard, WalletToken } from "@/components/wallet/TokenCard";
import { ImportTokenDialog } from "@/components/wallet/ImportTokenDialog";

const HIDDEN_TOKENS_KEY = "wallet_hidden_tokens";

export default function WalletDashboardPage() {
  const { wallet } = useWallet();
  const { contracts, loading: contractsLoading } = useContracts();
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenTokens, setHiddenTokens] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(HIDDEN_TOKENS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [showHidden, setShowHidden] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPrefill, setImportPrefill] = useState<{ address: string; name?: string; symbol?: string; decimals?: number } | null>(null);

  const toggleHideToken = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHidden = new Set(hiddenTokens);
    if (newHidden.has(address.toLowerCase())) {
      newHidden.delete(address.toLowerCase());
      toast.success("Token unhidden");
    } else {
      newHidden.add(address.toLowerCase());
      toast.success("Token hidden");
    }
    setHiddenTokens(newHidden);
    localStorage.setItem(HIDDEN_TOKENS_KEY, JSON.stringify([...newHidden]));
  };

  const openImport = (token?: WalletToken, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImportPrefill(
      token
        ? { address: token.contractAddress, name: token.name, symbol: token.symbol, decimals: token.decimals }
        : null
    );
    setImportOpen(true);
  };

  const scanWalletTokens = async () => {
    if (!wallet?.address) return;

    setLoading(true);
    setError(null);

    try {
      const { data: balancesData, error: balancesError } = await supabase.functions.invoke('alchemy-rpc', {
        body: { 
          method: 'alchemy_getTokenBalances', 
          params: { address: wallet.address } 
        },
      });

      if (balancesError) throw new Error(balancesError.message);
      if (balancesData?.error) throw new Error(balancesData.error);

      const tokenBalances = balancesData?.result?.tokenBalances || [];

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
  const unregisteredTokens = walletTokens.filter(t => !t.isRegistered && !hiddenTokens.has(t.contractAddress.toLowerCase()));
  const hiddenTokensList = walletTokens.filter(t => !t.isRegistered && hiddenTokens.has(t.contractAddress.toLowerCase()));

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openImport()}>
                <Plus className="w-4 h-4 mr-2" />
                Import token
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={scanWalletTokens}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Scan Wallet
              </Button>
            </div>
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
                  <CardContent className="pt-6">
                    <Skeleton className="h-5 w-32 mb-4" />
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
                    <TokenCard
                      key={token.contractAddress}
                      token={token}
                      onHide={toggleHideToken}
                      onImport={(t, e) => openImport(t, e)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hidden Tokens (Collapsible) */}
            {hiddenTokensList.length > 0 && (
              <Collapsible open={showHidden} onOpenChange={setShowHidden}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 w-full justify-start text-muted-foreground hover:text-foreground">
                    <EyeOff className="w-5 h-5" />
                    <span className="font-semibold">Hidden Tokens</span>
                    <Badge variant="secondary" className="ml-1">{hiddenTokensList.length}</Badge>
                    {showHidden ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {hiddenTokensList.map((token) => (
                      <TokenCard
                        key={token.contractAddress}
                        token={token}
                        onHide={toggleHideToken}
                        onImport={(t, e) => openImport(t, e)}
                        isHidden
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
        <ImportTokenDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          walletAddress={wallet?.address ?? null}
          prefill={importPrefill}
          onImported={scanWalletTokens}
        />
      </div>
    </AppLayout>
  );
}
