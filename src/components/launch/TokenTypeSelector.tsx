import { Banknote, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TokenType = "fiat" | "asset";

interface Props {
  value: TokenType;
  onChange: (t: TokenType) => void;
}

const options: { id: TokenType; title: string; desc: string; icon: typeof Building2 }[] = [
  { id: "asset", title: "Private Security", desc: "0 decimals - whole-unit shares", icon: Building2 },
];

export function TokenTypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((o) => {
        const Icon = o.icon;
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={cn(
              "text-left p-4 rounded-xl border bg-card transition-all",
              selected
                ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
                : "border-border hover:border-border/80"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{o.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{o.desc}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
