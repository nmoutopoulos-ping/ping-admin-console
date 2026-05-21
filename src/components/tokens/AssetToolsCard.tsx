import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrackedContract } from "@/lib/contractRegistry";
import { mintTokens, burnTokens, transferOwnership, renounceOwnership, isValidAddress } from "@/lib/onchain";
import { Coins, Flame, Crown, Loader2 } from "lucide-react";
import { TxResult, TxState, initialTxState } from "./shared/TxState";
import { AdminInput } from "./shared/AdminInput";
import { useContractAction } from "@/hooks/useContractAction";

interface AssetToolsCardProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function AssetToolsCard({ contract, isWalletConnected }: AssetToolsCardProps) {
  const { executeAction } = useContractAction();
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

  const handleMint = () => {
    if (!contract || !mintTo || !mintAmount) return;
    if (!isValidAddress(mintTo)) {
      setMintState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => mintTokens(contract, mintTo, mintAmount),
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
      () => burnTokens(contract, burnFrom, burnAmount),
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
      () => transferOwnership(contract, newOwner),
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
      () => renounceOwnership(contract),
      setOwnershipState,
      (result) => setOwnershipState({ loading: false, error: null, success: result.txHash })
    );
  };

  if (isDisabled) return null;

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
          <AdminInput placeholder="Recipient (0x...)" value={mintTo} onChange={setMintTo} />
          <AdminInput placeholder="Amount" value={mintAmount} onChange={setMintAmount} type="number" />
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
          <AdminInput placeholder="From address (0x...)" value={burnFrom} onChange={setBurnFrom} />
          <AdminInput placeholder="Amount" value={burnAmount} onChange={setBurnAmount} type="number" />
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
          <AdminInput placeholder="New owner (0x...)" value={newOwner} onChange={setNewOwner} />
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
