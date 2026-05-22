import { useState } from "react";
import { Rocket } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { LaunchStepper } from "@/components/launch/LaunchStepper";
import { LaunchConfigStep } from "@/components/launch/LaunchConfigStep";
import { LaunchReviewStep } from "@/components/launch/LaunchReviewStep";
import { LaunchDeployStep } from "@/components/launch/LaunchDeployStep";

export type TokenLaunchConfig = {
  type: "fiat" | "asset";
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
};

const defaultConfig: TokenLaunchConfig = {
  type: "asset",
  name: "",
  symbol: "",
  decimals: 0,
  initialSupply: "",
};

export default function LaunchTokenPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [config, setConfig] = useState<TokenLaunchConfig>(defaultConfig);

  const reset = () => {
    setConfig(defaultConfig);
    setStep(1);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Launch a token</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Deploy your own private security token to Sepolia in minutes.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <LaunchStepper current={step} />
            <div className="h-px bg-border" />
            {step === 1 && (
              <LaunchConfigStep
                config={config}
                setConfig={setConfig}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <LaunchReviewStep
                config={config}
                onBack={() => setStep(1)}
                onDeploy={() => setStep(3)}
              />
            )}
            {step === 3 && <LaunchDeployStep config={config} onReset={reset} />}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
