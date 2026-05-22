import { useState, useEffect } from "react";
import { Loader2, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import type { TokenLaunchConfig } from "@/pages/LaunchTokenPage";

interface Props {
  config: TokenLaunchConfig;
  onReset: () => void;
}

type State =
  | { status: "pending" }
  | { status: "success"; address: string }
  | { status: "error"; message: string };

export function LaunchDeployStep({ config, onReset }: Props) {
  const [state, setState] = useState<State>({ status: "pending" });
  const navigate = useNavigate();

  const run = async () => {
    setState({ status: "pending" });
    try {
      // TODO: Wire up PingTokenFactory.deployToken() call
      await new Promise((r) => setTimeout(r, 3000));
      const fake =
        "0x" +
        Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setState({ status: "success", address: fake });
    } catch (e) {
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Deployment failed",
      });
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {state.status === "pending" && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div className="text-center">
            <div className="font-semibold">Deploying your token…</div>
            <div className="text-sm text-muted-foreground mt-1">
              Confirm the transaction in your wallet and wait for confirmation.
            </div>
          </div>
        </div>
      )}

      {state.status === "success" && (
        <div className="space-y-5 py-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">Token deployed successfully!</div>
              <div className="text-sm text-muted-foreground">
                {config.name} ({config.symbol}) is now live on Sepolia.
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Contract address
            </div>
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-xs break-all">{state.address}</code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(state.address)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <a
              href={`https://sepolia.etherscan.io/address/${state.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View on Sepolia Etherscan <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="outline" onClick={onReset}>
              Launch another
            </Button>
            <Button onClick={() => navigate("/asset-tokens")}>
              Manage token →
            </Button>
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-5 py-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-destructive/15 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <div className="text-lg font-semibold">Deployment failed</div>
              <div className="text-sm text-muted-foreground">{state.message}</div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button variant="outline" onClick={onReset}>
              Start over
            </Button>
            <Button onClick={run}>Retry</Button>
          </div>
        </div>
      )}
    </div>
  );
}
