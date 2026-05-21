import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackedContract } from "@/lib/contractRegistry";
import {
  getTokenBalance,
  transferTokens,
  approveTokens,
  getAllowance,
  transferFromTokens,
  mintTokens,
  burnTokens,
  getContractOwner,
  isValidAddress,
  BalanceResult,
} from "@/lib/onchain";
import {
  Search,
  Send,
  Shield,
  ArrowRightLeft,
  Loader2,
  Settings2,
  Plus,
  Flame,
  Crown,
} from "lucide-react";
import { TxResult, TxState, initialTxState } from "./shared/TxState";
import { AdminInput } from "./shared/AdminInput";
import { useContractAction } from "@/hooks/useContractAction";

interface FiatAdminToolsProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function FiatAdminTools({ contract, isWalletConnected }: FiatAdminToolsProps) {
  const { executeAction } = useContractAction();
  const isDisabled = !contract || !isWalletConnected;

  // Balance
  const [balanceAddress, setBalanceAddress] = useState("");
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [balanceState, setBalanceState] = useState<TxState>(initialTxState);

  // Transfer
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferState, setTransferState] = useState<TxState>(initialTxState);

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

  // Mint
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintState, setMintState] = useState<TxState>(initialTxState);

  // Burn
  const [burnFrom, setBurnFrom] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [burnState, setBurnState] = useState<TxState>(initialTxState);

  // Owner
  const [owner, setOwner] = useState<string | null>(null);
  const [ownerState, setOwnerState] = useState<TxState>(initialTxState);

  const handleCheckBalance = () => {
    if (!contract || !balanceAddress) return;
    if (!isValidAddress(balanceAddress)) {
      setBalanceState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    setBalance(null);
    executeAction(
      () => getTokenBalance(contract, balanceAddress),
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
      () => transferTokens(contract, transferTo, transferAmount),
      setTransferState,
      (result) => setTransferState({ loading: false, error: null, success: result.txHash }),
      () => { setTransferTo(""); setTransferAmount(""); }
    );
  };

  const handleApprove = () => {
    if (!contract || !approveSpender || !approveAmount) return;
    if (!isValidAddress(approveSpender)) {
      setApproveState({ ...initialTxState, error: "Invalid address" });
      return;
    }
    executeAction(
      () => approveTokens(contract, approveSpender, approveAmount),
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
      () => getAllowance(contract, allowanceOwner, allowanceSpender),
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
      () => transferFromTokens(contract, tfFrom, tfTo, tfAmount),
      setTfState,
      (result) => setTfState({ loading: false, error: null, success: result.txHash }),
      () => { setTfFrom(""); setTfTo(""); setTfAmount(""); }
    );
  };

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

  const handleGetOwner = () => {
    if (!contract) return;
    setOwner(null);
    executeAction(
      () => getContractOwner(contract),
      setOwnerState,
      (result) => {
        setOwner(result);
        setOwnerState(initialTxState);
      }
    );
  };

  if (isDisabled) {
    return (
      <div className="console-card h-full">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-accent" />
          <h3 className="font-medium">Fiat Token Tools</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {!isWalletConnected ? "Connect wallet to use tools" : "Select a token first"}
        </p>
      </div>
    );
  }

  return (
    <div className="console-card h-full">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-4 h-4 text-accent" />
        <h3 className="font-medium">Fiat Token Tools</h3>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="supply">Supply</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Balance Check */}
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Search className="w-3.5 h-3.5 text-accent" />
                Balance Of
              </div>
              <AdminInput placeholder="Address (0x...)" value={balanceAddress} onChange={setBalanceAddress} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckBalance}
                disabled={balanceState.loading || !balanceAddress}
                className="w-full"
              >
                {balanceState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Balance"}
              </Button>
              <TxResult state={balanceState} />
              {balance && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-mono text-primary font-medium">{balance.formatted}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Allowance Check */}
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Allowance
              </div>
              <AdminInput placeholder="Owner (0x...)" value={allowanceOwner} onChange={setAllowanceOwner} />
              <AdminInput placeholder="Spender (0x...)" value={allowanceSpender} onChange={setAllowanceSpender} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCheckAllowance}
                disabled={allowanceState.loading || !allowanceOwner || !allowanceSpender}
                className="w-full"
              >
                {allowanceState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Allowance"}
              </Button>
              <TxResult state={allowanceState} />
              {allowanceResult && (
                <div className="p-2 bg-primary/5 border border-primary/20 rounded text-sm">
                  <span className="font-mono text-primary">{allowanceResult.formatted}</span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Transfer */}
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Send className="w-3.5 h-3.5 text-accent" />
                Transfer
              </div>
              <AdminInput placeholder="To (0x...)" value={transferTo} onChange={setTransferTo} />
              <AdminInput placeholder="Value" value={transferAmount} onChange={setTransferAmount} type="number" />
              <Button
                size="sm"
                onClick={handleTransfer}
                disabled={transferState.loading || !transferTo || !transferAmount}
                className="w-full"
              >
                {transferState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transfer"}
              </Button>
              <TxResult state={transferState} />
            </div>

            {/* TransferFrom */}
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-accent" />
                Transfer From
              </div>
              <AdminInput placeholder="From (0x...)" value={tfFrom} onChange={setTfFrom} />
              <AdminInput placeholder="To (0x...)" value={tfTo} onChange={setTfTo} />
              <AdminInput placeholder="Value" value={tfAmount} onChange={setTfAmount} type="number" />
              <Button
                size="sm"
                onClick={handleTransferFrom}
                disabled={tfState.loading || !tfFrom || !tfTo || !tfAmount}
                className="w-full"
              >
                {tfState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "TransferFrom"}
              </Button>
              <TxResult state={tfState} />
            </div>

            {/* Approve */}
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Approve
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <AdminInput placeholder="Spender (0x...)" value={approveSpender} onChange={setApproveSpender} />
                <AdminInput placeholder="Value" value={approveAmount} onChange={setApproveAmount} type="number" />
              </div>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approveState.loading || !approveSpender || !approveAmount}
                className="w-full"
              >
                {approveState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve"}
              </Button>
              <TxResult state={approveState} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="supply" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Mint */}
            <div className="space-y-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Plus className="w-3.5 h-3.5 text-green-500" />
                Mint
              </div>
              <AdminInput placeholder="To (0x...)" value={mintTo} onChange={setMintTo} />
              <AdminInput placeholder="Amount" value={mintAmount} onChange={setMintAmount} type="number" />
              <Button
                size="sm"
                onClick={handleMint}
                disabled={mintState.loading || !mintTo || !mintAmount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {mintState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mint Tokens"}
              </Button>
              <TxResult state={mintState} />
            </div>

            {/* Burn */}
            <div className="space-y-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Burn
              </div>
              <AdminInput placeholder="From (0x...)" value={burnFrom} onChange={setBurnFrom} />
              <AdminInput placeholder="Amount" value={burnAmount} onChange={setBurnAmount} type="number" />
              <Button
                size="sm"
                onClick={handleBurn}
                disabled={burnState.loading || !burnFrom || !burnAmount}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {burnState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Burn Tokens"}
              </Button>
              <TxResult state={burnState} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ownership" className="space-y-4">
          <div className="space-y-2 p-3 bg-secondary/20 rounded-lg max-w-md">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Crown className="w-3.5 h-3.5 text-yellow-500" />
              Contract Owner
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetOwner}
              disabled={ownerState.loading}
              className="w-full"
            >
              {ownerState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get Owner"}
            </Button>
            <TxResult state={ownerState} />
            {owner && (
              <div className="p-2 bg-primary/5 border border-primary/20 rounded">
                <span className="font-mono text-xs text-primary break-all">{owner}</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
