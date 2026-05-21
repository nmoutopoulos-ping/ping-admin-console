import { useState, useEffect } from "react";
import { TrackedContract } from "@/lib/contractRegistry";
import { getContractOwner } from "@/lib/onchain";

export function useIsContractOwner(contract: TrackedContract | null, walletAddress: string | null) {
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contract) {
      setOwner(null);
      return;
    }
    
    setLoading(true);
    getContractOwner(contract)
      .then(setOwner)
      .catch(() => setOwner(null))
      .finally(() => setLoading(false));
  }, [contract]);

  const isOwner = !!(owner && walletAddress && owner.toLowerCase() === walletAddress.toLowerCase());

  return { isOwner, owner, loading };
}
