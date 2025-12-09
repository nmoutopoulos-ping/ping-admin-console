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
        const simplified = message.includes("execution reverted")
          ? "Transaction reverted. Check permissions or insufficient balance."
          : message;
        setState({ loading: false, error: simplified, success: null });
      }
    },
    []
  );

  return { executeAction };
}
