import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useWallet } from "@/contexts/WalletContext";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Banknote, Building2, ArrowLeft, Copy, ExternalLink, Users, Coins, Hash, User, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { shortenAddress, getHoldersWithBalances } from "@/lib/onchain";
import { TrackedContract } from "@/lib/contractRegistry";
import { formatTokenBalance } from "@/lib/formatters";

type TokenDetail = {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
  totalSupplyFormatted: string;
  balance: string;
  balanceFormatted: string;
  owner: string | null;
  isRegistered: boolean;
  registeredType?: "asset";
  registeredLabel?: string;
  registeredId?: string;
};

type HolderInfo = {
  address: string;
  balance: string;
  balanceFormatted: string;
  percentage: number;
};

export default function WalletTokenDetailPage() {
  const { contractAddress } = useParams<{ contractAddress: string }>();
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { contracts } = useContracts();
  const [token, setToken] = useState<TokenDetail | null>(null);
  const [holders, setHolders] = useState<HolderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTokenDetail = async () => {
      if (!contractAddress) return;

      setLoading(true);
      setError(null);

      try {
        const { data: metaData, error: metaError } = await supabase.functions.invoke('alchemy-rpc', {
          body: { 
            method: 'alchemy_getTokenMetadata', 
            params: { contractAddress } 
          },
        });

        if (metaError) throw new Error(metaError.message);
        if (metaData?.error) throw new Error(metaData.error);

        const metadata = metaData?.result || {};
        const decimals = metadata.decimals ?? 18;

        const registeredContract = contracts.find(
          c => c.address.toLowerCase() === contractAddress.toLowerCase()
        );

        let balance = "0";
        let balanceFormatted = "0";
        if (wallet?.address) {
          const { data: balancesData } = await supabase.functions.invoke('alchemy-rpc', {
            body: { 
              method: 'alchemy_getTokenBalances', 
              params: { address: wallet.address } 
            },
          });
          
          const tokenBalance = balancesData?.result?.tokenBalances?.find(
            (t: { contractAddress: string }) => t.contractAddress.toLowerCase() === contractAddress.toLowerCase()
          );
          
          if (tokenBalance) {
            const balanceBigInt = BigInt(tokenBalance.tokenBalance);
            balance = balanceBigInt.toString();
            balanceFormatted = ethers.formatUnits(balanceBigInt, decimals);
          }
        }

        const { data: supplyData } = await supabase.functions.invoke('alchemy-rpc', {
          body: { 
            method: 'eth_call', 
            contractAddress,
            params: { data: '0x18160ddd' }
          },
        });

        let totalSupply = "0";
        let totalSupplyFormatted = "0";
        if (supplyData?.result && supplyData.result !== '0x') {
          const supplyBigInt = BigInt(supplyData.result);
          totalSupply = supplyBigInt.toString();
          totalSupplyFormatted = ethers.formatUnits(supplyBigInt, decimals);
        }

        let owner: string | null = null;
        const { data: ownerData } = await supabase.functions.invoke('alchemy-rpc', {
          body: { 
            method: 'eth_call', 
            contractAddress,
            params: { data: '0x8da5cb5b' }
          },
        });
        
        if (ownerData?.result && ownerData.result !== '0x' && ownerData.result.length >= 66) {
          owner = '0x' + ownerData.result.slice(-40);
        }

        setToken({
          contractAddress,
          symbol: metadata.symbol || "???",
          name: metadata.name || "Unknown Token",
          decimals,
          totalSupply,
          totalSupplyFormatted,
          balance,
          balanceFormatted,
          owner,
          isRegistered: !!registeredContract,
          registeredType: registeredContract?.type as "asset" | undefined,
          registeredLabel: registeredContract?.label,
          registeredId: registeredContract?.id,
        });

        if (registeredContract?.type === 'asset') {
          loadHolders(registeredContract, decimals, totalSupplyFormatted);
        }
      } catch (err) {
        console.error("Failed to load token:", err);
        setError(err instanceof Error ? err.message : "Failed to load token");
      } finally {
        setLoading(false);
      }
    };

    loadTokenDetail();
  }, [contractAddress, wallet?.address, contracts]);

  const loadHolders = async (registeredContract: TrackedContract, decimals: number, totalSupplyFormatted: string) => {
    setHoldersLoading(true);
    try {
      const holdersData = await getHoldersWithBalances(registeredContract);
      const totalSupplyNum = parseFloat(totalSupplyFormatted);
      
      const formattedHolders: HolderInfo[] = holdersData.addresses.map((address, i) => {
        const balance = holdersData.balances[i] || "0";
        const balanceFormatted = ethers.formatUnits(balance, decimals);
        const balanceNum = parseFloat(balanceFormatted);
        return {
          address,
          balance,
          balanceFormatted,
          percentage: totalSupplyNum > 0 ? (balanceNum / totalSupplyNum) * 100 : 0,
        };
      }).sort((a, b) => parseFloat(b.balanceFormatted) - parseFloat(a.balanceFormatted));
      
      setHolders(formattedHolders);
    } catch (err) {
      console.error("Failed to load holders:", err);
    } finally {
      setHoldersLoading(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !token) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/wallet')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Wallet
          </Button>
          <Card className="border-destructive">
            <CardContent className="py-6 text-center text-destructive">
              {error || "Token not found"}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/wallet')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {token.isRegistered ? token.registeredLabel : token.name}
              </h1>
              {token.isRegistered ? (
                <Badge variant="outline">
                  <Building2 className="w-3 h-3 mr-1" /> ASSET
                </Badge>
              ) : (
              <Badge variant="secondary">Not Registered</Badge>
            )}
            </div>
            <p className="text-muted-foreground">{token.symbol}</p>
          </div>
          
          {token.isRegistered && token.registeredId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/asset-tokens")}
              className="flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              Admin Tools
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" /> My Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTokenBalance(token.balanceFormatted, token.decimals)} {token.symbol}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4" /> Total Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTokenBalance(token.totalSupplyFormatted, token.decimals)} {token.symbol}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="w-4 h-4" /> Decimals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{token.decimals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Holders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {token.registeredType === 'asset' ? holders.length : '—'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contract Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Contract Address</p>
                <code className="text-sm font-mono">{token.contractAddress}</code>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => copyAddress(token.contractAddress)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href={`https://sepolia.etherscan.io/address/${token.contractAddress}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>

            {token.owner && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Owner</p>
                  <code className="text-sm font-mono">{token.owner}</code>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => copyAddress(token.owner!)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`https://sepolia.etherscan.io/address/${token.owner}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holders Table (Asset Tokens Only) */}
        {token.registeredType === 'asset' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" /> Token Holders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {holdersLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : holders.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No holders found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holders.map((holder) => (
                      <TableRow key={holder.address}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{shortenAddress(holder.address)}</code>
                            {holder.address.toLowerCase() === token.owner?.toLowerCase() && (
                              <Badge variant="outline" className="text-xs">
                                <User className="w-3 h-3 mr-1" /> Owner
                              </Badge>
                            )}
                            {holder.address.toLowerCase() === wallet?.address?.toLowerCase() && (
                              <Badge className="text-xs">You</Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyAddress(holder.address)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatTokenBalance(holder.balanceFormatted, token.decimals)} {token.symbol}
                        </TableCell>
                        <TableCell className="text-right">
                          {holder.percentage.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
