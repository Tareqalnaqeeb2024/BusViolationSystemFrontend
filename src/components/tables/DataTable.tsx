import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { Loading } from "@/components/common/Loading";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  mobileCard?: (row: T) => ReactNode;
  loading?: boolean;
};

export function DataTable<T>({ columns, rows, rowKey, empty, mobileCard, loading = false }: Props<T>) {
  if (loading) {
    return <Loading label="جارٍ تحميل السجلات..." />;
  }
  if (!rows.length) {
    return <>{empty ?? <EmptyState />}</>;
  }
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={cn("px-4 py-3 text-right font-medium", c.className)}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-muted/40">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle text-foreground/90", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Mobile */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row) =>
          mobileCard ? (
            <div key={rowKey(row)}>{mobileCard(row)}</div>
          ) : (
            <div key={rowKey(row)} className="rounded-xl border bg-card p-4 text-sm shadow-soft">
              <dl className="grid gap-2">
                {columns.map((c) => (
                  <div key={c.key} className="grid grid-cols-[minmax(0,110px)_1fr] gap-3">
                    <dt className="text-xs text-muted-foreground">{c.header}</dt>
                    <dd className="min-w-0 truncate text-foreground/90">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ),
        )}
      </div>
    </>
  );
}
