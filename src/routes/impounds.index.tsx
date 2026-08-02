import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBox } from "@/components/common/SearchBox";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { impoundService } from "@/api/impoundService";

export const Route = createFileRoute("/impounds/")({
  head: () => ({
    meta: [
      { title: "سجل الحجوزات" },
      { name: "description", content: "قائمة جميع عمليات الحجز الحالية والسابقة." },
    ],
  }),
  component: ImpoundsPage,
});

type ImpoundItem = {
  id: number;
  driverName: string;
  impoundReason: number | string;
  impoundDate: string;
  releaseDate?: string | null;
  status: string | number;
  notes?: string | null;
  vehicle: {
    plateNumber: number;
    governorateNumber: number;
    plateType: number;
    vehicleType: number;
  };
};

const IMPOUND_REASON_LABELS: Record<string, string> = {
  1: "نظام فرزة",
  2: "تشكيل فرزة",
  3: "عرقلة حركة السير",
  4: "مستهتر",
  5: "العمل في غير خطه",
  6: "بدون طبعة خط",
  7: "حادث",
  8: "عاكس خط",
};

const PLATE_TYPE_LABELS: Record<string, string> = {
  1: "خصوصي",
  2: "أجرة",
  3: "نقل",
};

// Columns are defined inside the component so they can access local handlers (release modal)

function ImpoundsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [rows, setRows] = useState<ImpoundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImpound, setSelectedImpound] = useState<ImpoundItem | null>(null);
  const [fineAmount, setFineAmount] = useState<number | "">("");
  const [receiptNumber, setReceiptNumber] = useState<number | "">("");
  const [releaseNotes, setReleaseNotes] = useState<string>("");
  const [releasedByUserId, setReleasedByUserId] = useState<number | "">("");

  const openReleaseFor = (item: ImpoundItem) => {
    setSelectedImpound(item);
    setFineAmount("");
    setReceiptNumber("");
    setReleaseNotes("");
    setReleasedByUserId("");
    setDialogOpen(true);
  };

  const submitRelease = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedImpound) return;
    try {
      const payload = {
        plateNumber: selectedImpound.vehicle.plateNumber,
        governorateNumber: selectedImpound.vehicle.governorateNumber,
        plateType: selectedImpound.vehicle.plateType,
        fineAmount: Number(fineAmount) || 0,
        receiptNumber: Number(receiptNumber) || 0,
        releaseNotes: releaseNotes || null,
        releasedByUserId: Number(releasedByUserId) || 0,
      } as Record<string, unknown>;

      await impoundService.releaseByRequest(payload);
      toast.success("تم الإفراج عن المركبة بنجاح");
      setDialogOpen(false);
      setSelectedImpound(null);
      // refresh list
      setPageNumber(1);
    } catch (err: any) {
      toast.error(err?.message || "فشل عملية الإفراج");
    }
  };

  const cols: Column<ImpoundItem>[] = [
    { key: "id", header: "الرقم", cell: (r) => <span className="ltr-nums font-medium">{r.id}</span> },
    {
      key: "plate",
      header: "رقم اللوحة",
      cell: (r) => (
        <span className="ltr-nums font-bold">{`${r.vehicle.plateNumber}-${r.vehicle.governorateNumber}`}</span>
      ),
    },
    { key: "plateType", header: "نوع اللوحة", cell: (r) => <span>{PLATE_TYPE_LABELS[String(r.vehicle.plateType)] || "أخرى"}</span> },
    { key: "reason", header: "السبب", cell: (r) => <span>{IMPOUND_REASON_LABELS[String(r.impoundReason)] ?? String(r.impoundReason)}</span> },
    { key: "date", header: "التاريخ", cell: (r) => <span className="ltr-nums text-muted-foreground">{new Date(r.impoundDate).toLocaleDateString('ar-EG')}</span> },
    { key: "st", header: "الحالة", cell: (r) => {
      const isImpounded = String(r.status) === "1" || String(r.status) === "Impounded";
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isImpounded ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
          {isImpounded ? "محجوزة" : "مُفرج عنها"}
        </span>
      );
    }},
    { key: "actions", header: "إجراءات", cell: (r) => (
      <div className="flex gap-2 justify-end">
        <Button size="sm" onClick={() => openReleaseFor(r)}>إجراءات الإفراج</Button>
      </div>
    ) },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      setPageNumber(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [q]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchImpounds = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await impoundService.list({
          searchTerm: debouncedQ || undefined,
          status: statusFilter !== "all" ? parseInt(statusFilter) : undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          pageNumber,
          pageSize,
        });
        setRows(result.data ?? []);
        setTotalCount(result.totalCount ?? 0);
      } catch (caught: any) {
        if (controller.signal.aborted) return;
        setError(caught?.message || "فشل تحميل سجلات الحجز");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchImpounds();
    return () => controller.abort();
  }, [debouncedQ, statusFilter, fromDate, toDate, pageNumber, pageSize]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-2">
      <PageHeader title="سجل الحجوزات" description="جميع عمليات الحجز في النظام." />
      
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <SearchBox value={q} onChange={setQ} placeholder="ابحث بالرقم أو اللوحة…" />
        </div>

        <div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPageNumber(1); }}>
            <SelectTrigger><SelectValue placeholder="فلترة بالحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="1">محجوزة فقط (Impounded)</SelectItem>
              <SelectItem value="2">مُفرج عنها فقط (Released)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Input 
            type="date" 
            value={fromDate} 
            onChange={(e) => { setFromDate(e.target.value); setPageNumber(1); }} 
          />
        </div>

        <div>
          <Input 
            type="date" 
            value={toDate} 
            onChange={(e) => { setToDate(e.target.value); setPageNumber(1); }} 
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mb-4">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground">تحميل سجلات الحجز...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
          لا توجد سجلات مطابقة للبحث.
        </div>
      ) : (
        <>
          {/* البطاقات المخصصة للجوال (Mobile Cards) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {rows.map((r) => {
              const isImpounded = String(r.status) === "1" || String(r.status) === "Impounded";
              return (
                <div key={r.id} className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-semibold text-muted-foreground">رقم السجل: #{r.id}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isImpounded
                          ? "bg-destructive/10 text-destructive"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {isImpounded ? "محجوزة" : "مُفرج عنها"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground block">رقم اللوحة:</span>
                      <span className="ltr-nums font-bold">{`${r.vehicle.plateNumber}-${r.vehicle.governorateNumber}`}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        النوع: {PLATE_TYPE_LABELS[String(r.vehicle.plateType)] || "أخرى"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">سبب الحجز:</span>
                      <span className="font-medium">{IMPOUND_REASON_LABELS[String(r.impoundReason)] ?? String(r.impoundReason)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>التاريخ:</span>
                    <span className="ltr-nums">{new Date(r.impoundDate).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button size="sm" onClick={() => openReleaseFor(r)}>إجراءات الإفراج</Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* الجدول المخصص للكمبيوتر والشاشات الكبيرة (Desktop Table) */}
          <div className="hidden rounded-xl border bg-card md:block">
            <DataTable columns={cols} rows={rows} rowKey={(r) => String(r.id)} />
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إجراءات الإفراج</DialogTitle>
            <DialogDescription>
              أدخل بيانات الإفراج للمركبة {selectedImpound ? `${selectedImpound.vehicle.plateNumber}-${selectedImpound.vehicle.governorateNumber}` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => submitRelease(e)} className="space-y-4">
            <div>
              <Label>المبلغ (ريال يمني)</Label>
              <Input
                type="number"
                value={String(fineAmount)}
                onChange={(e) => setFineAmount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <Label>رقم السند</Label>
              <Input
                type="number"
                value={String(receiptNumber)}
                onChange={(e) => setReceiptNumber(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <Label>ملاحظات الإفراج</Label>
              <Textarea value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} rows={4} />
            </div>

            {/* <div>
              <Label>رقم المستخدم الذي أفاد الإفراج (اختياري)</Label>
              <Input
                type="number"
                value={String(releasedByUserId)}
                onChange={(e) => setReleasedByUserId(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div> */}

            <DialogFooter>
              <div className="flex gap-2 w-full justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button type="submit">تأكيد الإفراج</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{totalCount} سجل إجمالي</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pageNumber <= 1 || loading}
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
          >
            السابق
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pageNumber >= Math.ceil(totalCount / pageSize) || loading}
            onClick={() => setPageNumber((prev) => prev + 1)}
          >
            التالي
          </Button>
        </div>
      </div>
    </div>
  );
}