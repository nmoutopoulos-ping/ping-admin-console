import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useContracts } from "@/hooks/useContracts";
import { toast } from "sonner";
import { getContractOwner, isValidAddress } from "@/lib/onchain";
import { ASSET_TOKEN_ABI, ERC20_ABI } from "@/lib/contractRegistry";

type Prefill = {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  walletAddress: string | null;
  prefill?: Prefill | null;
  onImported?: () => void;
}

type Status =
  | { state: "idle" }
  | { state: "verifying" }
  | { state: "verified"; owner: string }
  | { state: "error"; message: string };

export function ImportTokenDialog({ open, onOpenChange, walletAddress, prefill, onImported }: Props) {
  const { contracts, refetch } = useContracts();
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState<number>(18);
  const [type, setType] = useState<"asset" | "fiat">("fiat");
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAddress(prefill?.address ?? "");
      setLabel(prefill?.name && prefill?.symbol ? `${prefill.name} (${prefill.symbol})` : "");
      setSymbol(prefill?.symbol ?? "");
      setDecimals(prefill?.decimals ?? 18);
      setType("fiat");
      setStatus({ state: "idle" });
      setSaving(false);
    }
  }, [open, prefill]);

  const verifyOwnership = async () => {
    if (!walletAddress) {
      setStatus({ state: "error", message: "Connect your wallet first." });
      return;
    }
    if (!isValidAddress(address)) {
      setStatus({ state: "error", message: "Invalid contract address." });
      return;
    }
    setStatus({ state: "verifying" });
    try {
      const owner = await getContractOwner({
        id: "tmp",
        label: "tmp",
        address,
        type,
        decimals,
        abi: type === "asset" ? ASSET_TOKEN_ABI : ERC20_ABI,
      });
      if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
        setStatus({
          state: "error",
          message: `Connected wallet is not the contract owner. Owner is ${owner.slice(0, 6)}…${owner.slice(-4)}.`,
        });
        return;
      }
      setStatus({ state: "verified", owner });
    } catch (err) {
      setStatus({
        state: "error",
        message: err instanceof Error ? err.message : "Failed to read contract owner.",
      });
    }
  };

  const handleImport = async () => {
    if (status.state !== "verified") return;
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    setSaving(true);
    try {
      const checksummed = ethers.getAddress(address);
      // Avoid id collision
      const baseId = (symbol || "TOKEN").toUpperCase().replace(/[^A-Z0-9]/g, "");
      let id = baseId || "TOKEN";
      const existingIds = new Set(contracts.map((c) => c.id));
      if (existingIds.has(id)) {
        id = `${baseId}_${checksummed.slice(2, 6).toUpperCase()}`;
      }

      const { error } = await supabase.from("smart_contracts").insert({
        id,
        label: label.trim(),
        address: checksummed,
        type,
        decimals,
      });
      if (error) throw error;
      toast.success("Token imported");
      await refetch();
      onImported?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import token");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import token</DialogTitle>
          <DialogDescription>
            We verify ownership on-chain using <code>owner()</code>. Only the contract owner can register a token.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Contract address</Label>
            <Input
              id="address"
              placeholder="0x…"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setStatus({ state: "idle" });
              }}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as "asset" | "fiat")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fiat" id="type-fiat" />
                <Label htmlFor="type-fiat" className="font-normal cursor-pointer">Fiat</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="asset" id="type-asset" />
                <Label htmlFor="type-asset" className="font-normal cursor-pointer">Private Security</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="e.g. WYUSD"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Display label</Label>
            <Input
              id="label"
              placeholder="e.g. Wyoming USD (WYUSD)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          {status.state === "error" && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{status.message}</span>
            </div>
          )}
          {status.state === "verified" && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-primary/10 text-primary text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Ownership verified for connected wallet.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {status.state !== "verified" ? (
            <Button onClick={verifyOwnership} disabled={status.state === "verifying" || !address}>
              {status.state === "verifying" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Verify ownership
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import token
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}