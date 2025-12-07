import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract, EXPLORER_BASE_URL } from "@/lib/contractRegistry";
import {
  mintTokens,
  burnTokens,
  getContractOwner,
  transferOwnership,
  renounceOwnership,
  getHoldersWithBalances,
  isValidAddress,
  HoldersResult,
} from "@/lib/onchain";
import {
  Coins,
  Flame,
  Crown,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface AssetToolsCardProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

type TxState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

const initialTxState: TxState = { loading: false, error: null, success: null };

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
      <div className="p-2 bg-primary/5 border border-primary/20 rounded space-y-1">
        <div className="flex items-center gap-2 text-primary text-xs">
          <CheckCircle className="w-3 h-3" />
          <span className="font-medium">Success</span>
        </div>
        <a
          href={`${EXPLORER_BASE_URL}/tx/${state.success}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-accent hover:underline"
        >
          View tx <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }
  return null;
}

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
      className="console-input w-full text-sm"
    />
  );
}

export function AssetToolsCard({ contract, isWalletConnected }: AssetToolsCardProps) {
  const isAsset = contract?.type === "asset";
  const isDisabled = !contract || !isWalletConnected || !isAsset;

  // Mint
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintState, setMintState] = useState<TxState>(initialTxState);

  // Burn
  const [burnFrom, setBurnFrom] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [burnState, setBurnState] = useState<TxState>(initialTxState);

  // Ownership
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [newOwner, setNewOwner] = useState("");
  const [ownershipState, setOwnershipState] = useState<TxState>(initialTxState);

  // Holders
  const [holders, setHolders] = useState<HoldersResult | null>(null);
  const [holdersState, setHoldersState] = useState<TxState>(initialTxState);

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
        const simplified = message.includes("execution reverted")
          ? "Transaction reverted. Check permissions."
          : message;
        setState({ loading: false, error: simplified, success: null });
      }
    },
    []
  );

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
    setHolders(null);
    executeAction(
      () => getHoldersWithBalances(contract.id),
      setHoldersState,
      (result) => {
        setHolders(result);
        setHoldersState(initialTxState);
      }
    );
  };

  if (isDisabled) {
    if (!isAsset && contract) {
      return null; // Hide for non-asset tokens
    }
    return (
      <div className="console-card">
        <h3 className="font-medium mb-2">Asset Token Tools</h3>
        <p className="text-sm text-muted-foreground">
          {!contract ? "Select an asset token" : !isWalletConnected ? "Connect wallet first" : "Select an asset token"}
        </p>
      </div>
    );
  }

  return (
    <div className="console-card">
      <h3 className="font-medium mb-4">Asset Token Tools</h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Mint */}
        <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Coins className="w-3.5 h-3.5 text-green-500" />
            Mint
          </div>
          <AdminInput placeholder="To (0x...)" value={mintTo} onChange={setMintTo} />
          <AdminInput placeholder="Amount" value={mintAmount} onChange={setMintAmount} />
          <Button size="sm" onClick={handleMint} disabled={mintState.loading || !mintTo || !mintAmount} className="w-full">
            {mintState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mint"}
          </Button>
          <TxResult state={mintState} />
        </div>

        {/* Burn */}
        <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            Burn
          </div>
          <AdminInput placeholder="From (0x...)" value={burnFrom} onChange={setBurnFrom} />
          <AdminInput placeholder="Amount" value={burnAmount} onChange={setBurnAmount} />
          <Button variant="destructive" size="sm" onClick={handleBurn} disabled={burnState.loading || !burnFrom || !burnAmount} className="w-full">
            {burnState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Burn"}
          </Button>
          <TxResult state={burnState} />
        </div>

        {/* Ownership */}
        <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="w-3.5 h-3.5 text-yellow-500" />
            Ownership
          </div>
          <Button variant="outline" size="sm" onClick={handleGetOwner} disabled={ownerLoading} className="w-full">
            {ownerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Owner"}
          </Button>
          {ownerAddress && (
            <div className="p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono break-all">
              {ownerAddress}
            </div>
          )}
          <AdminInput placeholder="New owner (0x...)" value={newOwner} onChange={setNewOwner} />
          <Button size="sm" onClick={handleTransferOwnership} disabled={ownershipState.loading || !newOwner} className="w-full">
            {ownershipState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transfer"}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleRenounceOwnership} disabled={ownershipState.loading} className="w-full">
            Renounce
          </Button>
          <TxResult state={ownershipState} />
        </div>

        {/* Holders */}
        <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-3.5 h-3.5 text-primary" />
            Token Holders
          </div>
          <Button variant="outline" size="sm" onClick={handleGetHolders} disabled={holdersState.loading} className="w-full">
            {holdersState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Holders"}
          </Button>
          <TxResult state={holdersState} />
          {holders && holders.addresses.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {holders.addresses.map((addr, i) => (
                <div key={i} className="p-1.5 bg-primary/5 border border-primary/20 rounded text-xs font-mono flex justify-between gap-2">
                  <span className="truncate">{addr.slice(0, 8)}...{addr.slice(-6)}</span>
                  <span className="text-primary font-medium">{holders.balances[i]}</span>
                </div>
              ))}
            </div>
          )}
          {(!holders || holders.addresses.length === 0) && !holdersState.loading && !holdersState.error && (
            <p className="text-xs text-muted-foreground text-center">No holders yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
