import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract, EXPLORER_BASE_URL } from "@/lib/contractRegistry";
import {
  getTokenBalance,
  transferTokens,
  isValidAddress,
  BalanceResult,
} from "@/lib/onchain";
import {
  Search,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings2,
} from "lucide-react";

interface AdminToolsProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function AdminTools({ contract, isWalletConnected }: AdminToolsProps) {
  // Balance check state
  const [balanceAddress, setBalanceAddress] = useState("");
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Transfer state
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const handleCheckBalance = async () => {
    if (!contract || !balanceAddress) return;
    
    if (!isValidAddress(balanceAddress)) {
      setBalanceError("Invalid Ethereum address");
      return;
    }

    setBalanceLoading(true);
    setBalanceError(null);
    setBalance(null);

    try {
      const result = await getTokenBalance(contract.id, balanceAddress);
      setBalance(result);
    } catch (err) {
      setBalanceError(err instanceof Error ? err.message : "Failed to check balance");
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!contract || !transferTo || !transferAmount) return;

    if (!isValidAddress(transferTo)) {
      setTransferError("Invalid recipient address");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Invalid amount");
      return;
    }

    setTransferLoading(true);
    setTransferError(null);
    setTransferSuccess(null);

    try {
      const result = await transferTokens(contract.id, transferTo, transferAmount);
      setTransferSuccess(result.txHash);
      setTransferTo("");
      setTransferAmount("");
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  const isDisabled = !contract || !isWalletConnected;

  return (
    <div className="console-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Settings2 className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold">Admin Tools</h2>
      </div>

      {isDisabled ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 bg-secondary/50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>
            {!isWalletConnected
              ? "Connect your wallet to use admin tools"
              : "Select a contract to use admin tools"}
          </span>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Check Balance Section */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <h3 className="font-medium">Check Balance</h3>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter wallet address (0x...)"
                value={balanceAddress}
                onChange={(e) => setBalanceAddress(e.target.value)}
                className="console-input w-full"
              />

              <Button
                variant="console"
                onClick={handleCheckBalance}
                disabled={balanceLoading || !balanceAddress}
                className="w-full"
              >
                {balanceLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Get Balance
                  </>
                )}
              </Button>

              {balanceError && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{balanceError}</span>
                </div>
              )}

              {balance && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Formatted</span>
                    <span className="font-mono text-primary font-medium">
                      {balance.formatted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Raw</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {balance.raw}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transfer Section */}
          <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-accent" />
              <h3 className="font-medium">Transfer Tokens</h3>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Recipient address (0x...)"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="console-input w-full"
              />

              <input
                type="text"
                placeholder="Amount (human-readable)"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="console-input w-full"
              />

              <Button
                variant="accent"
                onClick={handleTransfer}
                disabled={transferLoading || !transferTo || !transferAmount}
                className="w-full"
              >
                {transferLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Awaiting Confirmation...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Transfer (MetaMask)
                  </>
                )}
              </Button>

              {transferError && (
                <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              {transferSuccess && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Transfer Successful!</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs break-all">
                      {transferSuccess.slice(0, 20)}...{transferSuccess.slice(-10)}
                    </span>
                    <a
                      href={`${EXPLORER_BASE_URL}/tx/${transferSuccess}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
