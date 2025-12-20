import { TrackedContract } from "@/lib/contractRegistry";
import { shortenAddress } from "@/lib/onchain";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TokenSelectorProps {
  contracts: TrackedContract[];
  selectedContract: TrackedContract | null;
  onSelect: (contract: TrackedContract) => void;
}

export function TokenSelector({ contracts, selectedContract, onSelect }: TokenSelectorProps) {
  const [copied, setCopied] = useState(false);
  const fiatContracts = contracts.filter((c) => c.type === "fiat");
  const assetContracts = contracts.filter((c) => c.type === "asset");

  const handleChange = (id: string) => {
    const contract = contracts.find((c) => c.id === id);
    if (contract) {
      onSelect(contract);
    }
  };

  const copyAddress = () => {
    if (selectedContract?.address) {
      navigator.clipboard.writeText(selectedContract.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="console-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">Select Token</h2>
      
      <Select value={selectedContract?.id || ""} onValueChange={handleChange}>
        <SelectTrigger className="w-full bg-secondary border-border">
          <SelectValue placeholder="Select a token..." />
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Fiat Tokens
          </div>
          {fiatContracts.map((contract) => (
            <SelectItem key={contract.id} value={contract.id} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="badge-fiat">FIAT</span>
                <span>{contract.label}</span>
              </div>
            </SelectItem>
          ))}
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">
            Asset Tokens
          </div>
          {assetContracts.map((contract) => (
            <SelectItem key={contract.id} value={contract.id} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="badge-asset">ASSET</span>
                <span>{contract.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedContract && (
        <div className="mt-4 flex flex-wrap items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
          <span className={selectedContract.type === "fiat" ? "badge-fiat" : "badge-asset"}>
            {selectedContract.type.toUpperCase()}
          </span>
          <span className="font-medium text-sm">{selectedContract.label}</span>
          <button
            onClick={copyAddress}
            className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded text-xs font-mono hover:bg-secondary/80 transition-colors"
          >
            <span className="hidden sm:inline">{selectedContract.address}</span>
            <span className="sm:hidden">{shortenAddress(selectedContract.address)}</span>
            {copied ? (
              <Check className="w-3 h-3 text-primary" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
          <span className="text-xs text-muted-foreground">ID: {selectedContract.id}</span>
          <span className="text-xs text-muted-foreground">Decimals: {selectedContract.decimals}</span>
        </div>
      )}
    </div>
  );
}
