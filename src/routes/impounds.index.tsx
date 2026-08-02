import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
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
import { getToken, getUserInfo } from "@/api/apiClient";
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
  releasedByUserName?: string | null;
  releasedByUserFullName?: string | null;
  releasedByUser?: string | null;
  userName?: string | null;
  fullName?: string | null;
  releasedBy?: string | null;
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

function formatDateValue(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleDateString("ar-EG");
}

function getReleasedByName(item: ImpoundItem): string {
  const candidates = [
    item.releasedByUserName,
    item.releasedByUserFullName,
    item.releasedByUser,
    item.userName,
    item.fullName,
    item.releasedBy,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return "—";
}

function isReleasedImpound(item: ImpoundItem): boolean {
  const status = String(item.status);
  return status === "2" || status === "Released" || Boolean(item.releaseDate);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = window.atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getLoggedInUserDisplayName(): string {
  if (typeof window === "undefined") {
    return "—";
  }

  const candidates: string[] = [];

  try {
    const userInfo = getUserInfo();
    if (userInfo?.fullName?.trim()) candidates.push(userInfo.fullName.trim());
    if (userInfo?.userName?.trim()) candidates.push(userInfo.userName.trim());
  } catch {
    // ignore
  }

  const directKeys = ["userName", "fullName", "displayName", "username", "currentUser"];
  for (const key of directKeys) {
    const value = window.localStorage.getItem(key);
    if (value?.trim()) {
      candidates.push(value.trim());
    }
  }

  try {
    const rawUserInfo = window.localStorage.getItem("user_info");
    if (rawUserInfo) {
      const parsedUserInfo = JSON.parse(rawUserInfo) as Record<string, unknown>;
      const parsedName =
        typeof parsedUserInfo.fullName === "string" ? parsedUserInfo.fullName.trim() : "";
      const parsedUserName =
        typeof parsedUserInfo.userName === "string"
          ? parsedUserInfo.userName.trim()
          : typeof parsedUserInfo.username === "string"
            ? parsedUserInfo.username.trim()
            : "";
      if (parsedName) candidates.push(parsedName);
      if (parsedUserName) candidates.push(parsedUserName);
    }
  } catch {
    // ignore
  }

  try {
    const loginSessionRaw = window.localStorage.getItem("loginSession");
    if (loginSessionRaw) {
      const loginSession = JSON.parse(loginSessionRaw) as Record<string, unknown>;
      const loginFullName =
        typeof loginSession.fullName === "string" ? loginSession.fullName.trim() : "";
      const loginUsername =
        typeof loginSession.username === "string"
          ? loginSession.username.trim()
          : typeof loginSession.userName === "string"
            ? loginSession.userName.trim()
            : "";
      if (loginFullName) candidates.push(loginFullName);
      if (loginUsername) candidates.push(loginUsername);
    }
  } catch {
    // ignore
  }

  const token = getToken();
  if (token) {
    const payload = decodeJwtPayload(token);
    const tokenName =
      (payload?.fullName as string | undefined) ||
      (payload?.name as string | undefined) ||
      (payload?.userName as string | undefined) ||
      (payload?.username as string | undefined) ||
      (payload?.sub as string | undefined) ||
      (payload?.email as string | undefined);

    if (typeof tokenName === "string" && tokenName.trim()) {
      candidates.push(tokenName.trim());
    }
  }

  return candidates.find(Boolean) ?? "—";
}

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

  const submitRelease = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!selectedImpound) return;
    try {
      const currentUserDisplayName = getLoggedInUserDisplayName();
      const payload = {
        plateNumber: selectedImpound.vehicle.plateNumber,
        governorateNumber: selectedImpound.vehicle.governorateNumber,
        plateType: selectedImpound.vehicle.plateType,
        fineAmount: Number(fineAmount) || 0,
        receiptNumber: Number(receiptNumber) || 0,
        releaseNotes: releaseNotes || null,
        releasedByUserId: Number(releasedByUserId) || 0,
        releasedByUserName: currentUserDisplayName,
        releasedByUserFullName: currentUserDisplayName,
      } as Record<string, unknown>;

      await impoundService.releaseByRequest(payload);
      setRows((prevRows) =>
        prevRows.map((item) =>
          item.id === selectedImpound.id
            ? {
                ...item,
                status: "2",
                releaseDate: new Date().toISOString(),
                releasedByUserName: currentUserDisplayName,
                releasedByUserFullName: currentUserDisplayName,
                releasedByUser: currentUserDisplayName,
              }
            : item,
        ),
      );
      toast.success("تم الإفراج عن المركبة بنجاح");
      setDialogOpen(false);
      setSelectedImpound(null);
      setPageNumber(1);
      await fetchImpounds(1, debouncedQ, statusFilter, fromDate, toDate);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل عملية الإفراج";
      toast.error(message);
    }
  };

  const cols: Column<ImpoundItem>[] = [
    {
      key: "id",
      header: "الرقم",
      cell: (r) => <span className="ltr-nums font-medium">{r.id}</span>,
    },
    {
      key: "plate",
      header: "رقم اللوحة",
      cell: (r) => (
        <span className="ltr-nums font-bold">{`${r.vehicle.plateNumber}-${r.vehicle.governorateNumber}`}</span>
      ),
    },
    {
      key: "plateType",
      header: "نوع اللوحة",
      cell: (r) => <span>{PLATE_TYPE_LABELS[String(r.vehicle.plateType)] || "أخرى"}</span>,
    },
    {
      key: "reason",
      header: "السبب",
      cell: (r) => <span>{IMPOUND_REASON_LABELS[String(r.impoundReason)] ?? String(r.impoundReason)}</span>,
    },
    {
      key: "impoundDate",
      header: "تاريخ الحجز",
      cell: (r) => <span className="ltr-nums text-muted-foreground">{formatDateValue(r.impoundDate)}</span>,
    },
    {
      key: "releaseDate",
      header: "تاريخ الإفراج",
      cell: (r) => <span className="ltr-nums text-muted-foreground">{formatDateValue(r.releaseDate)}</span>,
    },
    {
      key: "releasedBy",
      header: "اسم المستخدم",
      cell: (r) => <span className="text-sm">{getReleasedByName(r)}</span>,
    },
    {
      key: "st",
      header: "الحالة",
      cell: (r) => {
        const isImpounded = String(r.status) === "1" || String(r.status) === "Impounded";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isImpounded ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            {isImpounded ? "محجوزة" : "مُفرج عنها"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "إجراءات",
      cell: (r) => {
        const released = isReleasedImpound(r);
        return (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => openReleaseFor(r)} disabled={released}>
              {released ? "مُفرج عنها" : "إجراءات الإفراج"}
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      setPageNumber(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [q]);

  const fetchImpounds = useCallback(
    async (
      currentPage: number,
      currentQuery: string,
      currentStatus: string,
      currentFromDate: string,
      currentToDate: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = (await impoundService.list({
          searchTerm: currentQuery || undefined,
          status: currentStatus !== "all" ? parseInt(currentStatus) : undefined,
          fromDate: currentFromDate || undefined,
          toDate: currentToDate || undefined,
          pageNumber: currentPage,
          pageSize,
        })) as { data?: ImpoundItem[]; totalCount?: number };
        setRows(result.data ?? []);
        setTotalCount(result.totalCount ?? 0);
      } catch (caught: unknown) {
        const message = caught instanceof Error ? caught.message : "فشل تحميل سجلات الحجز";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    const controller = new AbortController();
    const runFetch = async () => {
      await fetchImpounds(pageNumber, debouncedQ, statusFilter, fromDate, toDate);
      if (controller.signal.aborted) return;
    };
    runFetch();
    return () => controller.abort();
  }, [debouncedQ, statusFilter, fromDate, toDate, pageNumber, fetchImpounds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-2">
      <PageHeader title="سجل الحجوزات" description="جميع عمليات الحجز في النظام." />
      
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <SearchBox value={q} onChange={setQ} placeholder="ابحث بالرقم أو اللوحة…" />
        </div>

        <div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPageNumber(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="فلترة بالحالة" />
            </SelectTrigger>
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
            onChange={(e) => {
              setFromDate(e.target.value);
              setPageNumber(1);
            }}
          />
        </div>

        <div>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPageNumber(1);
            }}
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
              const released = isReleasedImpound(r);
              return (
                <div
                  key={r.id}
                  className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      رقم السجل: #{r.id}
                    </span>
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
                      <span className="font-medium">
                        {IMPOUND_REASON_LABELS[String(r.impoundReason)] ?? String(r.impoundReason)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>تاريخ الحجز:</span>
                      <span className="ltr-nums">{formatDateValue(r.impoundDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>تاريخ الإفراج:</span>
                      <span className="ltr-nums">{formatDateValue(r.releaseDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>اسم المستخدم:</span>
                      <span className="text-right">{getReleasedByName(r)}</span>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <Button size="sm" onClick={() => openReleaseFor(r)} disabled={released}>
                      {released ? "مُفرج عنها" : "إجراءات الإفراج"}
                    </Button>
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
              أدخل بيانات الإفراج للمركبة{" "}
              {selectedImpound
                ? `${selectedImpound.vehicle.plateNumber}-${selectedImpound.vehicle.governorateNumber}`
                : ""}
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
                onChange={(e) =>
                  setReceiptNumber(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <div>
              <Label>ملاحظات الإفراج</Label>
              <Textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={4}
              />
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
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
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