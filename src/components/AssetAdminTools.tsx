import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract, EXPLORER_BASE_URL } from "@/lib/contractRegistry";
import {
  mintTokens,
  burnTokens,
  approveTokens,
  getAllowance,
  transferFromTokens,
  getContractOwner,
  transferOwnership,
  renounceOwnership,
  getHoldersWithBalance,
  isValidAddress,
  BalanceResult,
  TransferResult,
} from "@/lib/onchain";
import {
  Coins,
  Flame,
  Shield,
  ArrowRightLeft,
  Crown,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface AssetAdminToolsProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

type TxState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

const initialTxState: TxState = { loading: false, error: null, success: null };

function TxResult({ state, explorerBase }: { state: TxState; explorerBase: string }) {
  if (state.error) {
    return (
      <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        <span>{state.error}</span>
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Transaction Successful!</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs break-all">
            {state.success.slice(0, 16)}...{state.success.slice(-8)}
          </span>
          <a
            href={`${explorerBase}/tx/${state.success}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }
  return null;
}

export function AssetAdminTools({ contract, isWalletConnected }: AssetAdminToolsProps) {
  // Mint state
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintState, setMintState] = useState<TxState>(initialTxState);

  // Burn state
  const [burnFrom, setBurnFrom] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [burnState, setBurnState] = useState<TxState>(initialTxState);

  // Approve state
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [approveState, setApproveState] = useState<TxState>(initialTxState);

  // Allowance state
  const [allowanceOwner, setAllowanceOwner] = useState("");
  const [allowanceSpender, setAllowanceSpender] = useState("");
  const [allowanceResult, setAllowanceResult] = useState<BalanceResult | null>(null);
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [allowanceError, setAllowanceError] = useState<string | null>(null);

  // TransferFrom state
  const [tfFrom, setTfFrom] = useState("");
  const [tfTo, setTfTo] = useState("");
  const [tfAmount, setTfAmount] = useState("");
  const [tfState, setTfState] = useState<TxState>(initialTxState);

  // Ownership state
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [ownershipState, setOwnershipState] = useState<TxState>(initialTxState);

  // Holders state
  const [holders, setHolders] = useState<string[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersError, setHoldersError] = useState<string | null>(null);

  const isDisabled = !contract || !isWalletConnected || contract.type !== "asset";

  const handleMint = async () => {
    if (!contract || !mintTo || !mintAmount) return;
    if (!isValidAddress(mintTo)) {
      setMintState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    setMintState({ loading: true, error: null, success: null });
    try {
      const result = await mintTokens(contract.id, mintTo, mintAmount);
      setMintState({ loading: false, error: null, success: result.txHash });
      setMintTo("");
      setMintAmount("");
    } catch (err) {
      setMintState({ loading: false, error: err instanceof Error ? err.message : "Mint failed", success: null });
    }
  };

  const handleBurn = async () => {
    if (!contract || !burnFrom || !burnAmount) return;
    if (!isValidAddress(burnFrom)) {
      setBurnState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    setBurnState({ loading: true, error: null, success: null });
    try {
      const result = await burnTokens(contract.id, burnFrom, burnAmount);
      setBurnState({ loading: false, error: null, success: result.txHash });
      setBurnFrom("");
      setBurnAmount("");
    } catch (err) {
      setBurnState({ loading: false, error: err instanceof Error ? err.message : "Burn failed", success: null });
    }
  };

  const handleApprove = async () => {
    if (!contract || !approveSpender || !approveAmount) return;
    if (!isValidAddress(approveSpender)) {
      setApproveState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    setApproveState({ loading: true, error: null, success: null });
    try {
      const result = await approveTokens(contract.id, approveSpender, approveAmount);
      setApproveState({ loading: false, error: null, success: result.txHash });
      setApproveSpender("");
      setApproveAmount("");
    } catch (err) {
      setApproveState({ loading: false, error: err instanceof Error ? err.message : "Approve failed", success: null });
    }
  };

  const handleCheckAllowance = async () => {
    if (!contract || !allowanceOwner || !allowanceSpender) return;
    if (!isValidAddress(allowanceOwner) || !isValidAddress(allowanceSpender)) {
      setAllowanceError("Invalid address(es)");
      return;
    }
    setAllowanceLoading(true);
    setAllowanceError(null);
    setAllowanceResult(null);
    try {
      const result = await getAllowance(contract.id, allowanceOwner, allowanceSpender);
      setAllowanceResult(result);
    } catch (err) {
      setAllowanceError(err instanceof Error ? err.message : "Failed to check allowance");
    } finally {
      setAllowanceLoading(false);
    }
  };

  const handleTransferFrom = async () => {
    if (!contract || !tfFrom || !tfTo || !tfAmount) return;
    if (!isValidAddress(tfFrom) || !isValidAddress(tfTo)) {
      setTfState({ ...initialTxState, error: "Invalid address(es)" });
      return;
    }
    setTfState({ loading: true, error: null, success: null });
    try {
      const result = await transferFromTokens(contract.id, tfFrom, tfTo, tfAmount);
      setTfState({ loading: false, error: null, success: result.txHash });
      setTfFrom("");
      setTfTo("");
      setTfAmount("");
    } catch (err) {
      setTfState({ loading: false, error: err instanceof Error ? err.message : "TransferFrom failed", success: null });
    }
  };

  const handleGetOwner = async () => {
    if (!contract) return;
    setOwnerLoading(true);
    try {
      const owner = await getContractOwner(contract.id);
      setOwnerAddress(owner);
    } catch (err) {
      setOwnerAddress(null);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!contract || !newOwner) return;
    if (!isValidAddress(newOwner)) {
      setOwnershipState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    setOwnershipState({ loading: true, error: null, success: null });
    try {
      const result = await transferOwnership(contract.id, newOwner);
      setOwnershipState({ loading: false, error: null, success: result.txHash });
      setNewOwner("");
      setOwnerAddress(null);
    } catch (err) {
      setOwnershipState({ loading: false, error: err instanceof Error ? err.message : "Transfer ownership failed", success: null });
    }
  };

  const handleRenounceOwnership = async () => {
    if (!contract) return;
    if (!confirm("Are you sure you want to renounce ownership? This action is IRREVERSIBLE.")) return;
    setOwnershipState({ loading: true, error: null, success: null });
    try {
      const result = await renounceOwnership(contract.id);
      setOwnershipState({ loading: false, error: null, success: result.txHash });
      setOwnerAddress(null);
    } catch (err) {
      setOwnershipState({ loading: false, error: err instanceof Error ? err.message : "Renounce failed", success: null });
    }
  };

  const handleGetHolders = async () => {
    if (!contract) return;
    setHoldersLoading(true);
    setHoldersError(null);
    try {
      const result = await getHoldersWithBalance(contract.id);
      setHolders(result);
    } catch (err) {
      setHoldersError(err instanceof Error ? err.message : "Failed to get holders");
    } finally {
      setHoldersLoading(false);
    }
  };

  if (isDisabled) {
    return null;
  }

  return (
    <div className="console-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold">Asset Token Admin</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Mint */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-green-500" />
            <h3 className="font-medium">Mint</h3>
          </div>
          <input
            type="text"
            placeholder="To address (0x...)"
            value={mintTo}
            onChange={(e) => setMintTo(e.target.value)}
            className="console-input w-full"
          />
          <input
            type="text"
            placeholder="Amount"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            className="console-input w-full"
          />
          <Button
            variant="console"
            onClick={handleMint}
            disabled={mintState.loading || !mintTo || !mintAmount}
            className="w-full"
          >
            {mintState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
            Mint
          </Button>
          <TxResult state={mintState} explorerBase={EXPLORER_BASE_URL} />
        </div>

        {/* Burn */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-medium">Burn</h3>
          </div>
          <input
            type="text"
            placeholder="From address (0x...)"
            value={burnFrom}
            onChange={(e) => setBurnFrom(e.target.value)}
            className="console-input w-full"
          />
          <input
            type="text"
            placeholder="Amount"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            className="console-input w-full"
          />
          <Button
            variant="destructive"
            onClick={handleBurn}
            disabled={burnState.loading || !burnFrom || !burnAmount}
            className="w-full"
          >
            {burnState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            Burn
          </Button>
          <TxResult state={burnState} explorerBase={EXPLORER_BASE_URL} />
        </div>

        {/* Approve */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium">Approve</h3>
          </div>
          <input
            type="text"
            placeholder="Spender address (0x...)"
            value={approveSpender}
            onChange={(e) => setApproveSpender(e.target.value)}
            className="console-input w-full"
          />
          <input
            type="text"
            placeholder="Amount"
            value={approveAmount}
            onChange={(e) => setApproveAmount(e.target.value)}
            className="console-input w-full"
          />
          <Button
            variant="console"
            onClick={handleApprove}
            disabled={approveState.loading || !approveSpender || !approveAmount}
            className="w-full"
          >
            {approveState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Approve
          </Button>
          <TxResult state={approveState} explorerBase={EXPLORER_BASE_URL} />
        </div>

        {/* Check Allowance */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Check Allowance</h3>
          </div>
          <input
            type="text"
            placeholder="Owner address (0x...)"
            value={allowanceOwner}
            onChange={(e) => setAllowanceOwner(e.target.value)}
            className="console-input w-full"
          />
          <input
            type="text"
            placeholder="Spender address (0x...)"
            value={allowanceSpender}
            onChange={(e) => setAllowanceSpender(e.target.value)}
            className="console-input w-full"
          />
          <Button
            variant="console"
            onClick={handleCheckAllowance}
            disabled={allowanceLoading || !allowanceOwner || !allowanceSpender}
            className="w-full"
          >
            {allowanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
          </Button>
          {allowanceError && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>{allowanceError}</span>
            </div>
          )}
          {allowanceResult && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="font-mono text-primary">{allowanceResult.formatted}</span>
            </div>
          )}
        </div>

        {/* TransferFrom */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-accent" />
            <h3 className="font-medium">Transfer From</h3>
          </div>
          <input
            type="text"
            placeholder="From address (0x...)"
            value={tfFrom}
            onChange={(e) => setTfFrom(e.target.value)}
            className="console-input w-full"
          />
          <input
            type="text"
            placeholder="To address (0x...)"
            value={tfTo}
            onChange={(e) => setTfTo(e.target.value)}
            className="console-input w-full"
          />
          <input
            type="text"
            placeholder="Amount"
            value={tfAmount}
            onChange={(e) => setTfAmount(e.target.value)}
            className="console-input w-full"
          />
          <Button
            variant="accent"
            onClick={handleTransferFrom}
            disabled={tfState.loading || !tfFrom || !tfTo || !tfAmount}
            className="w-full"
          >
            {tfState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            TransferFrom
          </Button>
          <TxResult state={tfState} explorerBase={EXPLORER_BASE_URL} />
        </div>

        {/* Ownership */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            <h3 className="font-medium">Ownership</h3>
          </div>
          <Button variant="outline" onClick={handleGetOwner} disabled={ownerLoading} className="w-full">
            {ownerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Current Owner"}
          </Button>
          {ownerAddress && (
            <div className="p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono break-all">
              {ownerAddress}
            </div>
          )}
          <input
            type="text"
            placeholder="New owner address (0x...)"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            className="console-input w-full"
          />
          <Button
            variant="console"
            onClick={handleTransferOwnership}
            disabled={ownershipState.loading || !newOwner}
            className="w-full"
          >
            {ownershipState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transfer Ownership"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRenounceOwnership}
            disabled={ownershipState.loading}
            className="w-full"
          >
            Renounce Ownership
          </Button>
          <TxResult state={ownershipState} explorerBase={EXPLORER_BASE_URL} />
        </div>

        {/* Holders */}
        <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-medium">Token Holders</h3>
          </div>
          <Button variant="console" onClick={handleGetHolders} disabled={holdersLoading} className="w-full">
            {holdersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Holders with Balance"}
          </Button>
          {holdersError && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>{holdersError}</span>
            </div>
          )}
          {holders.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {holders.map((addr, i) => (
                <div key={i} className="p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono break-all">
                  {addr}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
