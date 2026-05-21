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
  isValidAddress,
  BalanceResult,
} from "@/lib/onchain";
import { Search, Send, Shield, ArrowRightLeft, Loader2, Settings2 } from "lucide-react";
import { TxResult, TxState, initialTxState } from "./shared/TxState";
import { AdminInput } from "./shared/AdminInput";
import { useContractAction } from "@/hooks/useContractAction";

interface AdminToolsTabsProps {
  contract: TrackedContract | null;
  isWalletConnected: boolean;
}

export function AdminToolsTabs({ contract, isWalletConnected }: AdminToolsTabsProps) {
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

  if (isDisabled) {
    return (
      <div className="console-card h-full">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-4 h-4 text-accent" />
          <h3 className="font-medium">Admin Tools</h3>
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
        <h3 className="font-medium">Admin Tools</h3>
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="transfers">Transfers & Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Wallet Address</label>
            <AdminInput placeholder="0x..." value={balanceAddress} onChange={setBalanceAddress} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckBalance}
              disabled={balanceState.loading || !balanceAddress}
              className="w-full"
            >
              {balanceState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Get Balance
            </Button>
            <TxResult state={balanceState} />
            {balance && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-mono text-primary font-medium">{balance.formatted}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-muted-foreground">Raw</span>
                  <span className="font-mono text-muted-foreground">{balance.raw}</span>
                </div>
              </div>
            )}
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
              <AdminInput placeholder="Recipient (0x...)" value={transferTo} onChange={setTransferTo} />
              <AdminInput placeholder="Amount" value={transferAmount} onChange={setTransferAmount} type="number" />
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
              <AdminInput placeholder="Amount" value={tfAmount} onChange={setTfAmount} type="number" />
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
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Approve
              </div>
              <AdminInput placeholder="Spender (0x...)" value={approveSpender} onChange={setApproveSpender} />
              <AdminInput placeholder="Amount" value={approveAmount} onChange={setApproveAmount} type="number" />
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

            {/* Check Allowance */}
            <div className="space-y-2 p-3 bg-secondary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Check Allowance
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
                {allowanceState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
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
      </Tabs>
    </div>
  );
}
