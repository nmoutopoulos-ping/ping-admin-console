import { useCallback } from "react";
import { TxState } from "@/components/tokens/shared/TxState";

export function useContractAction() {
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
        let simplified = message;
        
        if (message.includes("execution reverted")) {
          simplified = "Transaction reverted. Check permissions or insufficient balance.";
        } else if (message.includes("missing revert data") || message.includes("estimateGas")) {
          simplified = "Transaction would fail. For transferFrom: ensure the 'from' address has approved your wallet with sufficient allowance first.";
        } else if (message.includes("insufficient funds")) {
          simplified = "Insufficient ETH for gas fees.";
        }
        
        setState({ loading: false, error: simplified, success: null });
      }
    },
    []
  );

  return { executeAction };
}
