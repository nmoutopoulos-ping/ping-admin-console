import { TRACKED_CONTRACTS, TrackedContract } from "@/lib/contractRegistry";
import { shortenAddress } from "@/lib/onchain";
import { FileCode2, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContractSelectorProps {
  selectedContract: TrackedContract | null;
  onSelect: (contract: TrackedContract) => void;
}

export function ContractSelector({ selectedContract, onSelect }: ContractSelectorProps) {
  const fiatContracts = TRACKED_CONTRACTS.filter((c) => c.type === "fiat");
  const assetContracts = TRACKED_CONTRACTS.filter((c) => c.type === "asset");

  const handleChange = (id: string) => {
    const contract = TRACKED_CONTRACTS.find((c) => c.id === id);
    if (contract) {
      onSelect(contract);
    }
  };

  return (
    <div className="console-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <FileCode2 className="w-5 h-5 text-accent" />
        </div>
        <h2 className="text-lg font-semibold">Contract Selector</h2>
      </div>

      <div className="space-y-4">
        <Select
          value={selectedContract?.id || ""}
          onValueChange={handleChange}
        >
          <SelectTrigger className="w-full bg-secondary border-border">
            <SelectValue placeholder="Select a contract..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Fiat Tokens
            </div>
            {fiatContracts.map((contract) => (
              <SelectItem 
                key={contract.id} 
                value={contract.id}
                className="cursor-pointer"
              >
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
              <SelectItem 
                key={contract.id} 
                value={contract.id}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="badge-asset">ASSET</span>
                  <span>{contract.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedContract && (
          <div className="p-4 bg-secondary/50 rounded-lg border border-border space-y-3">
            <div className="flex items-center gap-2">
              <span className={selectedContract.type === "fiat" ? "badge-fiat" : "badge-asset"}>
                {selectedContract.type.toUpperCase()}
              </span>
              <span className="font-medium">{selectedContract.label}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Contract Address</p>
              <p className="font-mono text-sm break-all text-muted-foreground">
                {selectedContract.address}
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Decimals: </span>
                <span className="font-mono">{selectedContract.decimals}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ID: </span>
                <span className="font-mono">{selectedContract.id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
