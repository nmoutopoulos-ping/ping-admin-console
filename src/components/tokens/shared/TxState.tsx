import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { EXPLORER_BASE_URL } from "@/lib/contractRegistry";

export type TxState = {
  loading: boolean;
  error: string | null;
  success: string | null;
};

export const initialTxState: TxState = { loading: false, error: null, success: null };

export function TxResult({ state }: { state: TxState }) {
  if (state.error) {
    return (
      <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
        <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span className="break-words">{state.error}</span>
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="p-2 bg-primary/5 border border-primary/20 rounded space-y-1">
        <div className="flex items-center gap-2 text-primary text-xs">
          <CheckCircle className="w-3 h-3" />
          <span className="font-medium">Success</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs break-all">
            {state.success.slice(0, 10)}...{state.success.slice(-6)}
          </span>
          <a
            href={`${EXPLORER_BASE_URL}/tx/${state.success}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-accent hover:underline"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }
  return null;
}
