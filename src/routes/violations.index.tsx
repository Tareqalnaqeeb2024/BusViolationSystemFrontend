import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBox } from "@/components/common/SearchBox";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  violationService,
  EnPlateType,
  EnViolationType,
  EnViolationStatus,
  type ViolationItem,
} from "@/api/violationService";

export const Route = createFileRoute("/violations/")({
  head: () => ({
    meta: [
      { title: "سجل المخالفات" },
      { name: "description", content: "عرض جميع المخالفات المسجلة مع البحث والتصفية." },
    ],
  }),
  component: ViolationsListPage,
});

const PLATE_TYPE_LABELS: Record<number, string> = {
  [EnPlateType.Private]: "خصوصي",
  [EnPlateType.Taxi]: "أجرة",
  [EnPlateType.Transport]: "شحن",
};

const VIOLATION_TYPE_LABELS: Record<number, string> = {
  [EnViolationType.CheckpointSystem]: "نظام فرزة",
  [EnViolationType.FormingCheckpoint]: "تشكيل فرزة",
  [EnViolationType.ObstructingTraffic]: "عرقلة حركة السير",
  [EnViolationType.RecklessDriving]: "مستهتر",
  [EnViolationType.WorkingOutsideRoute]: "العمل في غير خطه",
  [EnViolationType.NoRouteSticker]: "بدون طبعة خط",
  [EnViolationType.WrongWay]: "عاكس خط",
};

type StatusMeta = { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" };

const VIOLATION_STATUS_META: Record<number, StatusMeta> = {
  [EnViolationStatus.Active]: { label: "فعالة", tone: "warning" },
  [EnViolationStatus.Cancelled]: { label: "ملغاة", tone: "danger" },
  // fallback لأي قيمة غير متوقعة زي الـ 0 اللي ظهر في العينة
  0: { label: "غير معروفة", tone: "neutral" },
};

const PAGE_SIZE = 10;

function ViolationsListPage() {
  const [q, setQ] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [rows, setRows] = useState<ViolationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<ViolationItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const searchParams = useMemo(() => {
    const params: Record<string, unknown> = { pageNumber, pageSize: PAGE_SIZE };
    const trimmed = q.trim();
    if (!trimmed) return params;
    const parts = trimmed.split(/[-–—]/).map((part) => part.trim());
    if (parts.length === 2 && /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      params.PlateNumber = Number(parts[0]);
      params.GovernorateNumber = Number(parts[1]);
    } else if (/^\d+$/.test(trimmed)) {
      params.PlateNumber = Number(trimmed);
    }
    return params;
  }, [q, pageNumber]);

  const fetchViolations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await violationService.list(searchParams);
      setRows(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "تعذر تحميل المخالفات، يرجى المحاولة مرة أخرى.");
      toast.error(err?.message || "تعذر تحميل المخالفات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ارجع لأول صفحة عند تغيير البحث
  useEffect(() => {
    setPageNumber(1);
  }, [q]);

  const openCancelDialog = (violation: ViolationItem) => {
    setSelectedViolation(violation);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedViolation) return;
    setCancelling(true);
    try {
      await violationService.cancel(selectedViolation.id);
      toast.success("تم إلغاء المخالفة بنجاح");
      setConfirmOpen(false);
      setSelectedViolation(null);
      fetchViolations();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "تعذر إلغاء المخالفة");
    } finally {
      setCancelling(false);
    }
  };

  const cols: Column<ViolationItem>[] = useMemo(
    () => [
      { key: "id", header: "الرقم", cell: (r) => <span className="ltr-nums font-medium">{r.id}</span> },
      {
        key: "plate",
        header: "اللوحة",
        cell: (r) => (
          <span className="ltr-nums">
            {r.vehiclePlateNumber ?? "—"}-{r.vehicleGovernorateNumber ?? "—"}
          </span>
        ),
      },
      {
        key: "type",
        header: "نوع اللوحة",
        cell: (r) => (r.vehiclePlateType ? PLATE_TYPE_LABELS[r.vehiclePlateType] ?? "—" : "—"),
      },
      {
        key: "violationType",
        header: "نوع المخالفة",
        cell: (r) => VIOLATION_TYPE_LABELS[r.violationType] ?? String(r.violationType ?? "—"),
      },
      {
        key: "date",
        header: "التاريخ",
        cell: (r) => (
          <span className="ltr-nums text-muted-foreground">
            {r.violationDate ? new Date(r.violationDate).toLocaleString("ar-EG") : "—"}
          </span>
        ),
      },
      {
        key: "status",
        header: "الحالة",
        cell: (r) => {
          const status = VIOLATION_STATUS_META[r.status] ?? { label: String(r.status ?? "—"), tone: "neutral" as const };
          return <StatusBadge tone={status.tone}>{status.label}</StatusBadge>;
        },
      },
      {
        key: "action",
        header: "",
        cell: (r) => (
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => openCancelDialog(r)}
            disabled={r.status === EnViolationStatus.Cancelled}
          >
            <XCircle className="h-4 w-4" /> إلغاء
          </Button>
        ),
      },
    ],
    []
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="سجل المخالفات"
        description="جميع المخالفات المسجلة في النظام."
        actions={
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/violations/add">
              <PlusCircle className="h-4 w-4" /> مخالفة جديدة
            </Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="ابحث برقم اللوحة أو الموقع…" />
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} loading={loading} />

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span className="ltr-nums">
          الصفحة {pageNumber} من {totalPages} — إجمالي {totalCount}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pageNumber <= 1 || loading}
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
          >
            السابق
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pageNumber >= totalPages || loading}
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
          >
            التالي
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="تأكيد الإلغاء"
        description={`هل أنت متأكد من إلغاء المخالفة رقم ${selectedViolation?.id ?? ""}؟`}
        confirmText="إلغاء المخالفة"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}