import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();

  // Auto-redirect after a short delay, or let user click
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/tokens");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gradient-primary">Ping Admin</h1>
            <p className="text-sm text-muted-foreground">Private Security Console</p>
          </div>
        </div>

        <p className="text-muted-foreground">Redirecting to console...</p>

        <Button onClick={() => navigate("/tokens")} size="lg">
          Go to Tokens
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
