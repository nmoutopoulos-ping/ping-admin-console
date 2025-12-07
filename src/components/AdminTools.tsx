import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract, EXPLORER_BASE_URL } from "@/lib/contractRegistry";
import {
  getTokenBalance,
  transferTokens,
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
} from "@/lib/onchain";
import {
  Search,
  Send,
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
  Settings2,
} from "lucide-react";

interface AdminToolsProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

type TxState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

const initialTxState: TxState = { loading: false, error: null, success: null };

// Reusable transaction result display
function TxResult({ state }: { state: TxState }) {
  if (state.error) {
    return (
      <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span className="break-words">{state.error}</span>
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Success!</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs break-all">
            {state.success.slice(0, 14)}...{state.success.slice(-6)}
          </span>
          <a
            href={`${EXPLORER_BASE_URL}/tx/${state.success}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent hover:underline flex-shrink-0"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }
  return null;
}

// Reusable input component
function AdminInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="console-input w-full"
    />
  );
}

// Reusable action card wrapper
function ActionCard({
  icon: Icon,
  iconColor,
  title,
  children,
  className = "",
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 p-4 bg-secondary/30 rounded-lg border border-border ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function AdminTools({ contract, isWalletConnected }: AdminToolsProps) {
  const isAsset = contract?.type === "asset";
  const isDisabled = !contract || !isWalletConnected;

  // Balance check
  const [balanceAddress, setBalanceAddress] = useState("");
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [balanceState, setBalanceState] = useState<TxState>(initialTxState);

  // Transfer
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferState, setTransferState] = useState<TxState>(initialTxState);

  // Mint (asset only)
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintState, setMintState] = useState<TxState>(initialTxState);

  // Burn (asset only)
  const [burnFrom, setBurnFrom] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [burnState, setBurnState] = useState<TxState>(initialTxState);

  // Approve
  const [approveSpender, setApproveSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [approveState, setApproveState] = useState<TxState>(initialTxState);

  // Allowance
  const [allowanceOwner, setAllowanceOwner] = useState("");
  const [allowanceSpender, setAllowanceSpender] = useState("");
  const [allowanceResult, setAllowanceResult] = useState<BalanceResult | null>(null);
  const [allowanceState, setAllowanceState] = useState<TxState>(initialTxState);

  // TransferFrom
  const [tfFrom, setTfFrom] = useState("");
  const [tfTo, setTfTo] = useState("");
  const [tfAmount, setTfAmount] = useState("");
  const [tfState, setTfState] = useState<TxState>(initialTxState);

  // Ownership (asset only)
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [ownershipState, setOwnershipState] = useState<TxState>(initialTxState);

  // Holders (asset only)
  const [holders, setHolders] = useState<string[]>([]);
  const [holdersState, setHoldersState] = useState<TxState>(initialTxState);

  // Generic handler wrapper to reduce boilerplate
  const executeAction = useCallback(
    async <T,>(
      action: () => Promise<T>,
      setState: React.Dispatch<React.SetStateAction<TxState>>,
      onSuccess?: (result: T) => void,
      resetFields?: () => void
    ) => {
      setState({ loading: true, error: null, success: null });
      try {
        const result = await action();
        if (onSuccess) onSuccess(result);
        if (resetFields) resetFields();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Action failed";
        // Simplify common error messages
        const simplified = message.includes("execution reverted")
          ? "Transaction reverted. You may not have permission or the operation is invalid."
          : message;
        setState({ loading: false, error: simplified, success: null });
      }
    },
    []
  );

  const handleCheckBalance = () => {
    if (!contract || !balanceAddress) return;
    if (!isValidAddress(balanceAddress)) {
      setBalanceState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    setBalance(null);
    executeAction(
      () => getTokenBalance(contract.id, balanceAddress),
      setBalanceState,
      (result) => {
        setBalance(result);
        setBalanceState(initialTxState);
      }
    );
  };

  const handleTransfer = () => {
    if (!contract || !transferTo || !transferAmount) return;
    if (!isValidAddress(transferTo)) {
      setTransferState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => transferTokens(contract.id, transferTo, transferAmount),
      setTransferState,
      (result) => setTransferState({ loading: false, error: null, success: result.txHash }),
      () => { setTransferTo(""); setTransferAmount(""); }
    );
  };

  const handleMint = () => {
    if (!contract || !mintTo || !mintAmount) return;
    if (!isValidAddress(mintTo)) {
      setMintState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => mintTokens(contract.id, mintTo, mintAmount),
      setMintState,
      (result) => setMintState({ loading: false, error: null, success: result.txHash }),
      () => { setMintTo(""); setMintAmount(""); }
    );
  };

  const handleBurn = () => {
    if (!contract || !burnFrom || !burnAmount) return;
    if (!isValidAddress(burnFrom)) {
      setBurnState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => burnTokens(contract.id, burnFrom, burnAmount),
      setBurnState,
      (result) => setBurnState({ loading: false, error: null, success: result.txHash }),
      () => { setBurnFrom(""); setBurnAmount(""); }
    );
  };

  const handleApprove = () => {
    if (!contract || !approveSpender || !approveAmount) return;
    if (!isValidAddress(approveSpender)) {
      setApproveState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => approveTokens(contract.id, approveSpender, approveAmount),
      setApproveState,
      (result) => setApproveState({ loading: false, error: null, success: result.txHash }),
      () => { setApproveSpender(""); setApproveAmount(""); }
    );
  };

  const handleCheckAllowance = () => {
    if (!contract || !allowanceOwner || !allowanceSpender) return;
    if (!isValidAddress(allowanceOwner) || !isValidAddress(allowanceSpender)) {
      setAllowanceState({ ...initialTxState, error: "Invalid address(es)" });
      return;
    }
    setAllowanceResult(null);
    executeAction(
      () => getAllowance(contract.id, allowanceOwner, allowanceSpender),
      setAllowanceState,
      (result) => {
        setAllowanceResult(result);
        setAllowanceState(initialTxState);
      }
    );
  };

  const handleTransferFrom = () => {
    if (!contract || !tfFrom || !tfTo || !tfAmount) return;
    if (!isValidAddress(tfFrom) || !isValidAddress(tfTo)) {
      setTfState({ ...initialTxState, error: "Invalid address(es)" });
      return;
    }
    executeAction(
      () => transferFromTokens(contract.id, tfFrom, tfTo, tfAmount),
      setTfState,
      (result) => setTfState({ loading: false, error: null, success: result.txHash }),
      () => { setTfFrom(""); setTfTo(""); setTfAmount(""); }
    );
  };

  const handleGetOwner = async () => {
    if (!contract) return;
    setOwnerLoading(true);
    try {
      const owner = await getContractOwner(contract.id);
      setOwnerAddress(owner);
    } catch {
      setOwnerAddress(null);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleTransferOwnership = () => {
    if (!contract || !newOwner) return;
    if (!isValidAddress(newOwner)) {
      setOwnershipState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => transferOwnership(contract.id, newOwner),
      setOwnershipState,
      (result) => {
        setOwnershipState({ loading: false, error: null, success: result.txHash });
        setNewOwner("");
        setOwnerAddress(null);
      }
    );
  };

  const handleRenounceOwnership = () => {
    if (!contract) return;
    if (!confirm("Are you sure? This action is IRREVERSIBLE.")) return;
    executeAction(
      () => renounceOwnership(contract.id),
      setOwnershipState,
      (result) => {
        setOwnershipState({ loading: false, error: null, success: result.txHash });
        setOwnerAddress(null);
      }
    );
  };

  const handleGetHolders = () => {
    if (!contract) return;
    setHolders([]);
    executeAction(
      () => getHoldersWithBalance(contract.id),
      setHoldersState,
      (result) => {
        setHolders(result);
        setHoldersState(initialTxState);
      }
    );
  };

  if (isDisabled) {
    return (
      <div className="console-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Settings2 className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-lg font-semibold">Admin Tools</h2>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 bg-secondary/50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>
            {!isWalletConnected
              ? "Connect your wallet to use admin tools"
              : "Select a contract to use admin tools"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="console-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Settings2 className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold">Admin Tools</h2>
        {isAsset && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Asset Token</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Check Balance */}
        <ActionCard icon={Search} iconColor="text-primary" title="Check Balance">
          <AdminInput placeholder="Wallet address (0x...)" value={balanceAddress} onChange={setBalanceAddress} />
          <Button
            variant="console"
            onClick={handleCheckBalance}
            disabled={balanceState.loading || !balanceAddress}
            className="w-full"
          >
            {balanceState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Get Balance
          </Button>
          <TxResult state={balanceState} />
          {balance && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Balance</span>
                <span className="font-mono text-primary font-medium">{balance.formatted}</span>
              </div>
            </div>
          )}
        </ActionCard>

        {/* Transfer */}
        <ActionCard icon={Send} iconColor="text-accent" title="Transfer">
          <AdminInput placeholder="Recipient (0x...)" value={transferTo} onChange={setTransferTo} />
          <AdminInput placeholder="Amount" value={transferAmount} onChange={setTransferAmount} />
          <Button
            variant="accent"
            onClick={handleTransfer}
            disabled={transferState.loading || !transferTo || !transferAmount}
            className="w-full"
          >
            {transferState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Transfer
          </Button>
          <TxResult state={transferState} />
        </ActionCard>

        {/* Mint (asset only) */}
        {isAsset && (
          <ActionCard icon={Coins} iconColor="text-green-500" title="Mint">
            <AdminInput placeholder="To address (0x...)" value={mintTo} onChange={setMintTo} />
            <AdminInput placeholder="Amount" value={mintAmount} onChange={setMintAmount} />
            <Button
              variant="console"
              onClick={handleMint}
              disabled={mintState.loading || !mintTo || !mintAmount}
              className="w-full"
            >
              {mintState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              Mint
            </Button>
            <TxResult state={mintState} />
          </ActionCard>
        )}

        {/* Burn (asset only) */}
        {isAsset && (
          <ActionCard icon={Flame} iconColor="text-orange-500" title="Burn">
            <AdminInput placeholder="From address (0x...)" value={burnFrom} onChange={setBurnFrom} />
            <AdminInput placeholder="Amount" value={burnAmount} onChange={setBurnAmount} />
            <Button
              variant="destructive"
              onClick={handleBurn}
              disabled={burnState.loading || !burnFrom || !burnAmount}
              className="w-full"
            >
              {burnState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
              Burn
            </Button>
            <TxResult state={burnState} />
          </ActionCard>
        )}

        {/* Approve */}
        <ActionCard icon={Shield} iconColor="text-blue-500" title="Approve">
          <AdminInput placeholder="Spender (0x...)" value={approveSpender} onChange={setApproveSpender} />
          <AdminInput placeholder="Amount" value={approveAmount} onChange={setApproveAmount} />
          <Button
            variant="console"
            onClick={handleApprove}
            disabled={approveState.loading || !approveSpender || !approveAmount}
            className="w-full"
          >
            {approveState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Approve
          </Button>
          <TxResult state={approveState} />
        </ActionCard>

        {/* Check Allowance */}
        <ActionCard icon={Shield} iconColor="text-primary" title="Check Allowance">
          <AdminInput placeholder="Owner (0x...)" value={allowanceOwner} onChange={setAllowanceOwner} />
          <AdminInput placeholder="Spender (0x...)" value={allowanceSpender} onChange={setAllowanceSpender} />
          <Button
            variant="console"
            onClick={handleCheckAllowance}
            disabled={allowanceState.loading || !allowanceOwner || !allowanceSpender}
            className="w-full"
          >
            {allowanceState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
          </Button>
          <TxResult state={allowanceState} />
          {allowanceResult && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="font-mono text-primary">{allowanceResult.formatted}</span>
            </div>
          )}
        </ActionCard>

        {/* TransferFrom */}
        <ActionCard icon={ArrowRightLeft} iconColor="text-accent" title="Transfer From">
          <AdminInput placeholder="From (0x...)" value={tfFrom} onChange={setTfFrom} />
          <AdminInput placeholder="To (0x...)" value={tfTo} onChange={setTfTo} />
          <AdminInput placeholder="Amount" value={tfAmount} onChange={setTfAmount} />
          <Button
            variant="accent"
            onClick={handleTransferFrom}
            disabled={tfState.loading || !tfFrom || !tfTo || !tfAmount}
            className="w-full"
          >
            {tfState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            TransferFrom
          </Button>
          <TxResult state={tfState} />
        </ActionCard>

        {/* Ownership (asset only) */}
        {isAsset && (
          <ActionCard icon={Crown} iconColor="text-yellow-500" title="Ownership">
            <Button variant="outline" onClick={handleGetOwner} disabled={ownerLoading} className="w-full">
              {ownerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Current Owner"}
            </Button>
            {ownerAddress && (
              <div className="p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono break-all">
                {ownerAddress}
              </div>
            )}
            <AdminInput placeholder="New owner (0x...)" value={newOwner} onChange={setNewOwner} />
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
            <TxResult state={ownershipState} />
          </ActionCard>
        )}

        {/* Holders (asset only) */}
        {isAsset && (
          <ActionCard icon={Users} iconColor="text-primary" title="Token Holders" className="md:col-span-2 xl:col-span-1">
            <Button variant="console" onClick={handleGetHolders} disabled={holdersState.loading} className="w-full">
              {holdersState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Holders with Balance"}
            </Button>
            <TxResult state={holdersState} />
            {holders.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {holders.map((addr, i) => (
                  <div key={i} className="p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono break-all">
                    {addr}
                  </div>
                ))}
              </div>
            )}
            {holders.length === 0 && !holdersState.loading && !holdersState.error && (
              <p className="text-xs text-muted-foreground text-center">No holders data yet</p>
            )}
          </ActionCard>
        )}
      </div>
    </div>
  );
}
