import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarRange,
  Car,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  PLATE_TYPE_LABELS,
  VIOLATION_TYPE_LABELS,
  type DashboardStatisticsResponse,
  type StatisticsPeriod,
} from "@/api/dashboardService";
import { dashboardService } from "@/api/dashboardService";
import { Loading } from "@/components/common/Loading";

function StatCard({
  label,
  value,
  icon,
  loading,
  accentClass,
  iconClass,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  loading?: boolean;
  accentClass: string;
  iconClass: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-linear-to-br ${accentClass} p-4 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight ltr-nums">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : value.toLocaleString("ar-EG")}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/80 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [period, setPeriod] = useState<StatisticsPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatisticsResponse | null>(null);

  const recentViolations = stats?.recentViolations ?? [];
  const recentImpounds = stats?.recentImpounds ?? [];
  const topViolatingVehicles = stats?.topViolatingVehicles ?? [];

  const periods: StatisticsPeriod[] = ["day", "week", "month", "year"];

  const getViolationLabel = (value: number) => VIOLATION_TYPE_LABELS[value] ?? `غير معروف (${value})`;
  const getPlateTypeLabel = (value: number) => PLATE_TYPE_LABELS[value] ?? `غير معروف (${value})`;

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const data = await dashboardService.statistics(period);
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-primary/10 via-background to-background p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-[11px] font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              نظرة عامة سريعة
            </div>
            <h2 className="text-2xl font-bold tracking-tight">لوحة التحكم</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              تابع أداء النظام، أحدث المخالفات والحجوزات، وأكثر المركبات مخالفة من مكان واحد.
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              الفترة الزمنية
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    period === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p === "day"
                    ? "اليوم"
                    : p === "week"
                      ? "أسبوع"
                      : p === "month"
                        ? "الشهر"
                        : "السنة"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي المخالفات"
          value={stats?.totalViolations ?? 0}
          loading={loading}
          accentClass="from-blue-500/10 via-blue-500/5 to-background"
          iconClass="text-blue-600"
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          label="إجمالي الحجوزات"
          value={stats?.totalImpounds ?? 0}
          loading={loading}
          accentClass="from-amber-500/10 via-amber-500/5 to-background"
          iconClass="text-amber-600"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label="إجمالي الإفراجات"
          value={stats?.totalReleases ?? 0}
          loading={loading}
          accentClass="from-emerald-500/10 via-emerald-500/5 to-background"
          iconClass="text-emerald-600"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="الحجوزات النشطة"
          value={stats?.activeImpoundsCount ?? 0}
          loading={loading}
          accentClass="from-rose-500/10 via-rose-500/5 to-background"
          iconClass="text-rose-600"
          icon={<Car className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4 text-primary" />
              آخر 10 مخالفات مسجلة
            </h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
              محدث
            </span>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              <Loading label="جارٍ تحميل المخالفات..." className="py-4 text-xs" />
            ) : recentViolations.length > 0 ? (
              recentViolations.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold ltr-nums">
                      لوحة #{v.plateNumber}-{v.governorateNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      نوع المخالفة: {getViolationLabel(v.violationType)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ltr-nums">
                    {new Date(v.violationDate).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                لا توجد مخالفات مسجلة حديثاً.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-4 w-4 text-amber-500" />
              أحدث الحجوزات المرورية
            </h3>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
              نشط
            </span>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              <Loading label="جارٍ تحميل الحجوزات..." className="py-4 text-xs" />
            ) : recentImpounds.length > 0 ? (
              recentImpounds.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold ltr-nums">
                      لوحة #{i.plateNumber}-{i.governorateNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      السائق: {i.driverName || "غير محدد"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      i.releaseDate
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600"
                    }`}
                  >
                    {i.releaseDate ? "مفرج عنها" : "محجوزة"}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                لا توجد حجوزات نشطة حديثاً.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-rose-500" />
            أكثر 10 باصات/مركبات مخالفة
          </h3>
          <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold text-rose-600">
            أعلى التكرار
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-right text-xs">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground">
                <th className="p-3 text-right">رقم اللوحة</th>
                <th className="p-3 text-right">المحافظة</th>
                <th className="p-3 text-right">نوع اللوحة</th>
                <th className="p-3 text-right">عدد المخالفات التراكمي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    <Loading label="جارٍ تحميل البيانات..." className="py-4 text-xs" />
                  </td>
                </tr>
              ) : topViolatingVehicles.length > 0 ? (
                topViolatingVehicles.map((tv) => (
                  <tr
                    key={tv.vehicleId}
                    className="bg-background/40 transition-colors hover:bg-muted/20"
                  >
                    <td className="p-3 font-bold ltr-nums">{tv.plateNumber}</td>
                    <td className="p-3 ltr-nums">{tv.governorateNumber}</td>
                    <td className="p-3">{getPlateTypeLabel(tv.plateType)}</td>
                    <td className="p-3 font-bold text-rose-600 ltr-nums">
                      {tv.violationsCount} مخالفات
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    لا توجد بيانات متاحة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: DashboardHome,
});
