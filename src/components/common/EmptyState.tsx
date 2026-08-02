import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title = "لا توجد بيانات",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
