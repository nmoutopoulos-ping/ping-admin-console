import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ERC20_ABI, ASSET_TOKEN_ABI, TrackedContract } from "@/lib/contractRegistry";

export function useContracts() {
  const [contracts, setContracts] = useState<TrackedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("smart_contracts")
        .select("*")
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      const mapped: TrackedContract[] = (data || []).map((row) => ({
        id: row.id,
        label: row.label,
        address: row.address,
        type: "asset",
        decimals: row.decimals,
        abi: ASSET_TOKEN_ABI,
      }));

      setContracts(mapped);
    } catch (err) {
      console.error("Failed to fetch contracts:", err);
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, []);

  const addContract = useCallback(
    async (contract: Omit<TrackedContract, "abi">) => {
      const { error: insertError } = await supabase.from("smart_contracts").insert({
        id: contract.id,
        label: contract.label,
        address: contract.address,
        type: contract.type,
        decimals: contract.decimals,
      });

      if (insertError) throw insertError;
      await fetchContracts();
    },
    [fetchContracts]
  );

  const deleteContract = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("smart_contracts")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchContracts();
    },
    [fetchContracts]
  );

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return { contracts, loading, error, refetch: fetchContracts, addContract, deleteContract };
}
