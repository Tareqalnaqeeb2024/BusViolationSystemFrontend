import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorMessage({
  message = "حدث خطأ ما.",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0">{message}</p>
    </div>
  );
}
