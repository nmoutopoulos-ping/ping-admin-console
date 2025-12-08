import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract, EXPLORER_BASE_URL } from "@/lib/contractRegistry";
import {
  mintTokens,
  burnTokens,
  transferOwnership,
  renounceOwnership,
  isValidAddress,
} from "@/lib/onchain";
import {
  Coins,
  Flame,
  Crown,
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
      <div className="p-2 bg-primary/10 border border-primary/20 rounded space-y-1">
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

function ToolInput({
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
      className="w-full bg-secondary/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
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
  const [newOwner, setNewOwner] = useState("");
  const [ownershipState, setOwnershipState] = useState<TxState>(initialTxState);

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
      }
    );
  };

  const handleRenounceOwnership = () => {
    if (!contract) return;
    if (!confirm("Are you sure? This action is IRREVERSIBLE.")) return;
    executeAction(
      () => renounceOwnership(contract.id),
      setOwnershipState,
      (result) => setOwnershipState({ loading: false, error: null, success: result.txHash })
    );
  };

  if (isDisabled) {
    if (!isAsset && contract) return null;
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Admin Tools
      </h3>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Mint */}
        <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Coins className="w-4 h-4 text-green-500" />
            Mint Tokens
          </div>
          <ToolInput placeholder="Recipient (0x...)" value={mintTo} onChange={setMintTo} />
          <ToolInput placeholder="Amount" value={mintAmount} onChange={setMintAmount} />
          <Button 
            size="sm" 
            onClick={handleMint} 
            disabled={mintState.loading || !mintTo || !mintAmount} 
            className="w-full"
          >
            {mintState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mint"}
          </Button>
          <TxResult state={mintState} />
        </div>

        {/* Burn */}
        <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Flame className="w-4 h-4 text-orange-500" />
            Burn Tokens
          </div>
          <ToolInput placeholder="From address (0x...)" value={burnFrom} onChange={setBurnFrom} />
          <ToolInput placeholder="Amount" value={burnAmount} onChange={setBurnAmount} />
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBurn} 
            disabled={burnState.loading || !burnFrom || !burnAmount} 
            className="w-full"
          >
            {burnState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Burn"}
          </Button>
          <TxResult state={burnState} />
        </div>

        {/* Ownership */}
        <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-secondary/20">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Crown className="w-4 h-4 text-yellow-500" />
            Ownership
          </div>
          <ToolInput placeholder="New owner (0x...)" value={newOwner} onChange={setNewOwner} />
          <Button 
            size="sm" 
            onClick={handleTransferOwnership} 
            disabled={ownershipState.loading || !newOwner} 
            className="w-full"
          >
            {ownershipState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transfer"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRenounceOwnership} 
            disabled={ownershipState.loading} 
            className="w-full text-destructive hover:text-destructive"
          >
            Renounce
          </Button>
          <TxResult state={ownershipState} />
        </div>
      </div>
    </div>
  );
}
