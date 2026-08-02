import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-foreground/80 border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-primary/10 text-primary border-primary/20",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
