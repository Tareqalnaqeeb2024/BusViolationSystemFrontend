import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, icon: Icon, trend, hint, className }: Props) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground ltr-nums">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground/70">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 font-medium",
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {trend.value}
          </span>
          <span className="text-muted-foreground">مقارنة بالشهر الماضي</span>
        </div>
      )}
    </div>
  );
}
