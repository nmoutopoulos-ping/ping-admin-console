import { useState, useEffect, useCallback } from "react";
import { TrackedContract } from "@/lib/contractRegistry";
import { getHoldersWithBalances, HoldersResult, shortenAddress, getContractOwner } from "@/lib/onchain";
import { RefreshCw, Loader2, AlertCircle, Users, Crown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface HoldersTableProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function HoldersTable({ contract, isWalletConnected }: HoldersTableProps) {
  const [holders, setHolders] = useState<HoldersResult | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadHolders = useCallback(async () => {
    if (!contract || !isWalletConnected) return;
    if (contract.type !== "asset") return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [holdersData, ownerAddress] = await Promise.all([
        getHoldersWithBalances(contract.id),
        getContractOwner(contract.id)
      ]);
      setHolders(holdersData);
      setOwner(ownerAddress);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load holders");
      setHolders(null);
    } finally {
      setLoading(false);
    }
  }, [contract, isWalletConnected]);

  useEffect(() => {
    if (contract && isWalletConnected && contract.type === "asset") {
      loadHolders();
    } else {
      setHolders(null);
      setOwner(null);
      setError(null);
    }
  }, [contract?.id, isWalletConnected]);

  const canLoad = contract && isWalletConnected && contract.type === "asset";

  if (!canLoad) {
    return null;
  }

  const explorerUrl = "https://sepolia.etherscan.io/address/";

  return (
    <div className="console-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-medium">Cap Table</h3>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadHolders}
          disabled={loading}
          className="h-7 w-7"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading holders...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      ) : holders && holders.addresses.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">% Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holders.addresses.map((address, index) => {
                const balance = parseInt(holders.balances[index] || "0");
                const totalSupply = holders.balances.reduce((sum, b) => sum + parseInt(b || "0"), 0);
                const percentage = totalSupply > 0 ? ((balance / totalSupply) * 100).toFixed(2) : "0.00";
                const isOwner = owner && address.toLowerCase() === owner.toLowerCase();
                
                return (
                  <TableRow key={address} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={`${explorerUrl}${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {shortenAddress(address)}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        {isOwner && (
                          <Badge variant="outline" className="text-xs gap-1 py-0">
                            <Crown className="w-3 h-3" />
                            Owner
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {percentage}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No holders found
        </div>
      )}
    </div>
  );
}
