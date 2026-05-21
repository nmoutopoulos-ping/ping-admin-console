import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Configure", "Review", "Deploy"];

export function LaunchStepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-3 w-full">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-center gap-3 flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors",
                  done && "bg-primary text-primary-foreground border-primary",
                  active && "bg-primary/15 text-primary border-primary",
                  !done && !active && "bg-muted text-muted-foreground border-border"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : n}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px flex-1", n < current ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
