import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ElementType } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FileText, Car, Undo2, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  PLATE_TYPE_LABELS,
  VIOLATION_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  IMPOUND_REASON_LABELS,
  IMPOUND_STATUS_LABELS,
  EnImpoundStatus,
  type DashboardStatisticsResponse,
  type StatisticsPeriod,
} from "@/api/dashboardService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الإحصائيات" },
      { name: "description", content: "إحصاءات مفصلة عن المخالفات والحجوزات." },
    ],
  }),
  component: StatisticsPage,
});

// ==================== كارت إحصائية بلمسة لونية مميزة ====================

function StatTile({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-md"
      style={{ borderInlineStart: `3px solid ${accent}` }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ==================== دائرة أيقونة صغيرة للصفوف ====================

function RowIcon({ icon: Icon, tone }: { icon: ElementType; tone: "warning" | "danger" | "success" }) {
  const toneColor =
    tone === "danger"
      ? "var(--color-destructive, #ef4444)"
      : tone === "success"
        ? "var(--color-chart-2, #16a34a)"
        : "var(--color-chart-1, #d97706)";
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `color-mix(in srgb, ${toneColor} 15%, transparent)`, color: toneColor }}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>;
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function StatisticsPage() {
  const [period, setPeriod] = useState<StatisticsPeriod>("month");
  const [data, setData] = useState<DashboardStatisticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardService.statistics(period);
        if (!cancelled) setData(res);
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError(err?.message || "تعذر تحميل الإحصائيات");
          toast.error(err?.message || "تعذر تحميل الإحصائيات");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="الإحصائيات"
        description="نظرة تحليلية على الأداء العام."
        actions={
          <div className="flex gap-1.5 rounded-lg bg-muted p-1">
            {(["week", "month", "year"] as StatisticsPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "week" ? "أسبوع" : p === "month" ? "شهر" : "سنة"}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="إجمالي المخالفات"
          value={(data?.totalViolations ?? 0).toLocaleString("ar-EG")}
          icon={FileText}
          accent="var(--color-chart-1, #d97706)"
          loading={loading}
        />
        <StatTile
          label="إجمالي الحجوزات"
          value={(data?.totalImpounds ?? 0).toLocaleString("ar-EG")}
          icon={Lock}
          accent="var(--color-chart-3, #7c3aed)"
          loading={loading}
        />
        <StatTile
          label="إجمالي الإفراجات"
          value={(data?.totalReleases ?? 0).toLocaleString("ar-EG")}
          icon={Undo2}
          accent="var(--color-chart-2, #16a34a)"
          loading={loading}
        />
        <StatTile
          label="حجوزات فعالة"
          value={(data?.activeImpoundsCount ?? 0).toLocaleString("ar-EG")}
          icon={Car}
          accent="var(--color-chart-4, #dc2626)"
          loading={loading}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* أحدث المخالفات */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">أحدث المخالفات</h3>
            {!loading && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {data?.recentViolations?.length ?? 0}
              </span>
            )}
          </div>
          <div className="mt-2 divide-y">
            {loading && (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            )}
            {!loading && (data?.recentViolations?.length ?? 0) === 0 && (
              <EmptyRow message="لا توجد مخالفات حديثة." />
            )}
            {!loading &&
              data?.recentViolations?.map((v) => (
                <div key={v.id} className="flex items-center gap-3 py-3 text-sm">
                  <RowIcon icon={AlertTriangle} tone="warning" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium ltr-nums">
                      {v.plateNumber}-{v.governorateNumber}
                      <span className="mr-2 font-normal text-muted-foreground">
                        {PLATE_TYPE_LABELS[v.plateType] ?? "—"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {VIOLATION_TYPE_LABELS[v.violationType] ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground ltr-nums">
                    {new Date(v.violationDate).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* المركبات الأكثر مخالفة */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">المركبات الأكثر مخالفة</h3>
            {!loading && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {data?.topViolatingVehicles?.length ?? 0}
              </span>
            )}
          </div>
          <div className="mt-2 divide-y">
            {loading && (
              <>
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </>
            )}
            {!loading && (data?.topViolatingVehicles?.length ?? 0) === 0 && (
              <EmptyRow message="لا توجد بيانات كافية." />
            )}
            {!loading &&
              data?.topViolatingVehicles?.map((v, i) => (
                <div key={v.vehicleId} className="flex items-center gap-3 py-3 text-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium ltr-nums">
                      {v.plateNumber}-{v.governorateNumber}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {VEHICLE_TYPE_LABELS[v.vehicleType] ?? "—"} · {PLATE_TYPE_LABELS[v.plateType] ?? "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold ltr-nums">
                    {v.violationsCount}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* أحدث الحجوزات */}
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">أحدث الحجوزات</h3>
            {!loading && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {data?.recentImpounds?.length ?? 0}
              </span>
            )}
          </div>
          <div className="mt-2 divide-y">
            {loading && (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            )}
            {!loading && (data?.recentImpounds?.length ?? 0) === 0 && (
              <EmptyRow message="لا توجد حجوزات حديثة." />
            )}
            {!loading &&
              data?.recentImpounds?.map((imp) => {
                const status = IMPOUND_STATUS_LABELS[imp.status] ?? { label: "—", tone: "warning" as const };
                const isReleased = imp.status === EnImpoundStatus.Released;
                return (
                  <div key={imp.id} className="flex items-center gap-3 py-3 text-sm">
                    <RowIcon icon={isReleased ? ShieldCheck : Lock} tone={isReleased ? "success" : "warning"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium ltr-nums">
                        {imp.plateNumber}-{imp.governorateNumber}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {IMPOUND_REASON_LABELS[imp.impoundReason] ?? "—"}
                        {imp.driverName ? ` · ${imp.driverName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      <span className="text-xs text-muted-foreground ltr-nums">
                        {new Date(imp.impoundDate).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}