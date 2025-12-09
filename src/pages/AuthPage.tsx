import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap, Wallet, CheckCircle } from "lucide-react";
import { z } from "zod";
import { connectWallet, shortenAddress } from "@/lib/onchain";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthStep = "credentials" | "wallet";

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  useEffect(() => {
    // Check if already fully authenticated (has session + verified wallet in localStorage)
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const verifiedWallet = localStorage.getItem("verified_admin_wallet");
      
      if (session?.user && verifiedWallet) {
        navigate("/fiat-tokens");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Credentials verified. Please connect your wallet.");
      setStep("wallet");
    }
  };

  const handleConnectWallet = async () => {
    setLoading(true);
    try {
      const walletInfo = await connectWallet();
      setConnectedWallet(walletInfo.address);
      
      // Verify wallet is in admin_wallets table
      const { data: adminWallets, error } = await supabase
        .from("admin_wallets")
        .select("wallet_address")
        .ilike("wallet_address", walletInfo.address);
      
      if (error) {
        throw new Error("Failed to verify wallet");
      }
      
      if (!adminWallets || adminWallets.length === 0) {
        // Sign out since wallet is not authorized
        await supabase.auth.signOut();
        toast.error("This wallet is not authorized for admin access.");
        setStep("credentials");
        setConnectedWallet(null);
        return;
      }
      
      // Store verified wallet in localStorage
      localStorage.setItem("verified_admin_wallet", walletInfo.address);
      toast.success("Wallet verified! Redirecting...");
      navigate("/fiat-tokens");
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect wallet");
      setConnectedWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setConnectedWallet(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Zap className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Ping Admin</CardTitle>
          <CardDescription>
            {step === "credentials" 
              ? "Sign in to access the console" 
              : "Connect your authorized wallet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "credentials" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Sign In
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary">Email verified</span>
              </div>
              
              {connectedWallet ? (
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                  <p className="font-mono text-sm">{shortenAddress(connectedWallet)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Connect your MetaMask wallet to verify admin access.
                </p>
              )}
              
              <Button 
                onClick={handleConnectWallet} 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Wallet className="w-4 h-4 mr-2" />
                )}
                {connectedWallet ? "Verifying..." : "Connect Wallet"}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleCancel} 
                className="w-full"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
