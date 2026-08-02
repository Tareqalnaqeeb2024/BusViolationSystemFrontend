import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Clock, Search, ShieldAlert } from "lucide-react";
import { vehicleService } from "@/api/vehicleService";

export const Route = createFileRoute("/vehicles/search")({
  head: () => ({
    meta: [
      { title: "البحث عن مركبة" },
      { name: "description", content: "ابحث عن مركبة برقم اللوحة والنوع لعرض سجلها الكامل." },
    ],
  }),
  component: SearchVehiclePage,
});

const PLATE_TYPE_LABELS: Record<string, string> = {
  1: "خصوصي",
  2: "أجرة",
  3: "شحن",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  1: "سيارة خاصة",
  2: "حافلة",
  3: "شاحنة",
  4: "دراجة نارية",
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
  Impounded: "محجوزة",
  Released: "مُفرج عنها",
};

const VIOLATION_TYPE_LABELS: Record<string, string> = {
  1: "نظام فرزة",
  2: "تشكيل فرزة",
  3: "عرقلة حركة السير",
  4: "مستهتر",
  5: "العمل في غير خطه",
  6: "بدون طبعة خط",
  7: "عاكس خط",
};

const IMPOUND_STATUS_LABELS: Record<string, string> = {
  1: "محجوزة",
  2: "مُفرج عنها",
  Impounded: "محجوزة",
  Released: "مُفرج عنها",
};

const CURRENT_STATUS_LABELS: Record<string, string> = {
  Available: "متاحة",
  Impounded: "محجوزة",
  available: "متاحة",
  impounded: "محجوزة",
};

type BackendRecord = Record<string, unknown>;

type SearchVehicleResponse = BackendRecord & {
  Vehicle?: BackendRecord;
  CurrentStatus?: string;
  TotalViolationsCount?: number;
  TotalImpoundsCount?: number;
  LastViolation?: BackendRecord;
  ActiveImpound?: BackendRecord;
  ViolationHistory?: BackendRecord[];
  ImpoundHistory?: BackendRecord[];
  vehicle?: BackendRecord;
  activeImpound?: BackendRecord;
  impoundHistory?: BackendRecord[];
  violations?: BackendRecord[];
  violationHistory?: BackendRecord[];
  totalViolationsCount?: number;
  totalImpoundsCount?: number;
};

function isRecord(value: unknown): value is BackendRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFirstArray(data: SearchVehicleResponse, keys: string[]): BackendRecord[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return [];
}

function getFirstRecord(data: SearchVehicleResponse, keys: string[]): BackendRecord | null {
  for (const key of keys) {
    const value = data[key];
    if (isRecord(value)) {
      return value;
    }
  }
  return null;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toLocaleString("ar-EG");
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDateString(value: string): string {
  const date = new Date(value);
  if (!Number.isNaN(date.valueOf())) {
    return date.toLocaleDateString("ar-EG");
  }
  return value;
}

function getDisplayLabel(key: string): string {
  const labels: Record<string, string> = {
    plateNumber: "رقم اللوحة",
    PlateNumber: "رقم اللوحة",
    governorateNumber: "المحافظة",
    GovernorateNumber: "المحافظة",
    plateType: "نوع اللوحة",
    PlateType: "نوع اللوحة",
    vehicleType: "نوع المركبة",
    VehicleType: "نوع المركبة",
    id: "الرقم",
    Id: "الرقم",
    ReceiptNumber: "رقم السند",
    receiptNumber: "رقم السند",
    FineAmount: "المبلغ",
    fineAmount: "المبلغ",
    UserFullName: "اسم المستخدم",
    userFullName: "اسم المستخدم",
    model: "الموديل",
    ownerName: "اسم المالك",
    chassisNumber: "رقم الشاسيه",
    engineNumber: "رقم المحرك",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    impoundReason: "سبب الحجز",
    ImpoundReason: "سبب الحجز",
    violationType: "نوع المخالفة",
    ViolationType: "نوع المخالفة",
    status: "الحالة",
    Status: "الحالة",
    impoundDate: "تاريخ الحجز",
    ImpoundDate: "تاريخ الحجز",
    releaseDate: "تاريخ الإفراج",
    ReleaseDate: "تاريخ الإفراج",
    violationDate: "تاريخ المخالفة",
    ViolationDate: "تاريخ المخالفة",
    notes: "ملاحظات",
    Notes: "ملاحظات",
    driverName: "اسم السائق",
    DriverName: "اسم السائق",
    CurrentStatus: "الحالة الحالية",
    currentStatus: "الحالة الحالية",
    TotalViolationsCount: "عدد المخالفات",
    TotalImpoundsCount: "عدد الحجوزات",
    LastViolation: "آخر مخالفة",
    ActiveImpound: "الحجز النشط",
    ViolationHistory: "سجل المخالفات",
    ImpoundHistory: "سجل الحجوزات",
  };
  return labels[key] ?? key;
}

function getEnumLabel(key: string, value: unknown): string | undefined {
  const maps: Record<string, Record<string, string>> = {
    plateType: PLATE_TYPE_LABELS,
    PlateType: PLATE_TYPE_LABELS,
    vehicleType: VEHICLE_TYPE_LABELS,
    VehicleType: VEHICLE_TYPE_LABELS,
    impoundReason: IMPOUND_REASON_LABELS,
    ImpoundReason: IMPOUND_REASON_LABELS,
    violationType: VIOLATION_TYPE_LABELS,
    ViolationType: VIOLATION_TYPE_LABELS,
    status: IMPOUND_STATUS_LABELS,
    Status: IMPOUND_STATUS_LABELS,
    CurrentStatus: CURRENT_STATUS_LABELS,
    currentStatus: CURRENT_STATUS_LABELS,
  };
  const map = maps[key];
  return map ? map[String(value)] : undefined;
}

function formatDisplayValue(key: string, value: unknown): string {
  const enumLabel = getEnumLabel(key, value);
  if (enumLabel) return enumLabel;
  if (typeof value === "string" && /\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDateString(value);
  }
  return formatValue(value);
}

function getRecordValue(record: BackendRecord | null | undefined, key: string): unknown {
  if (!record) return undefined;
  return record[key];
}

function SearchVehiclePage() {
  const [plateType, setPlateType] = useState("2");
  const [plateNumber, setPlateNumber] = useState("222");
  const [governorateNumber, setGovernorateNumber] = useState("1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchVehicleResponse | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!plateNumber || !governorateNumber) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const result = await vehicleService.search({
        PlateNumber: plateNumber,
        GovernorateNumber: governorateNumber,
        PlateType: plateType,
      });

      const payload = (Array.isArray(result) ? result[0] : result) as SearchVehicleResponse | undefined;
      setSearchResult(payload ?? null);
      if (!payload) {
        setError("لم يتم العثور على المركبة");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ أثناء البحث عن المركبة";
      setError(message);
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const vehicleData = getFirstRecord(searchResult ?? {}, ["Vehicle", "vehicle"]);
  const activeImpound = getFirstRecord(searchResult ?? {}, ["ActiveImpound", "activeImpound"]);
  const impoundHistory = getFirstArray(searchResult ?? {}, ["ImpoundHistory", "impoundHistory"]);
  const violations = getFirstArray(searchResult ?? {}, ["ViolationHistory", "violations"]);
  const isImpounded = Boolean(activeImpound);
  const plateLabel = getRecordValue(vehicleData, "PlateNumber") ?? getRecordValue(vehicleData, "plateNumber");
  const governorateLabel = getRecordValue(vehicleData, "GovernorateNumber") ?? getRecordValue(vehicleData, "governorateNumber");
  const plateTypeLabel = getRecordValue(vehicleData, "PlateType") ?? getRecordValue(vehicleData, "plateType") ?? plateType;
  const vehicleTypeLabel = getRecordValue(vehicleData, "VehicleType") ?? getRecordValue(vehicleData, "vehicleType");
  const currentStatusLabel = getEnumLabel("CurrentStatus", searchResult?.CurrentStatus ?? searchResult?.currentStatus) ?? formatValue(searchResult?.CurrentStatus ?? searchResult?.currentStatus);

  return (
    <div className="mx-auto max-w-5xl px-4 py-2">
      <PageHeader
        title="البحث عن مركبة"
        description="ابحث عن مركبة برقم اللوحة والنوع لعرض كل البيانات القادمة من الخلفية."
      />

      <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">نوع اللوحة</Label>
            <Select value={plateType} onValueChange={setPlateType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">أجرة</SelectItem>
                <SelectItem value="1">خصوصي</SelectItem>
                <SelectItem value="3">شحن</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">رقم اللوحة</Label>
            <Input
              inputMode="numeric"
              placeholder="2356"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.replace(/\D/g, ""))}
              className="ltr-nums font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">رقم المحافظة (الفاصل)</Label>
            <Input
              inputMode="numeric"
              placeholder="1"
              value={governorateNumber}
              onChange={(e) => setGovernorateNumber(e.target.value.replace(/\D/g, ""))}
              className="ltr-nums font-semibold"
            />
          </div>

          <div className="sm:col-span-4">
            <Button type="submit" disabled={loading} className="w-full gap-2 sm:w-auto">
              <Search className="h-4 w-4" />
              {loading ? "جاري البحث..." : "بحث"}
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="rounded-xl border bg-card p-12 text-center text-sm text-muted-foreground">
            جاري جلب بيانات المركبة من الخادم...
          </div>
        ) : searchResult ? (
          <div className="flex flex-col gap-6">
            <div
              className={`rounded-xl border p-4 sm:p-6 ${
                isImpounded
                  ? "border-destructive/20 bg-destructive/5"
                  : "border-emerald-500/20 bg-emerald-500/5"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-3 ${
                      isImpounded ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {isImpounded ? <ShieldAlert className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold sm:text-lg">
                      اللوحة: {" "}
                      <span className="ltr-nums">
                        {formatValue(plateLabel)}-{formatValue(governorateLabel)}
                      </span>
                      <span className="mr-2 text-sm font-normal text-muted-foreground">
                        ({PLATE_TYPE_LABELS[String(plateTypeLabel)]})
                      </span>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                      {isImpounded
                        ? "هذه المركبة محجوزة حاليا في النظام."
                        : "المركبة ليست محجوزة حاليا."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="rounded-lg border bg-background px-3 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground">المخالفات</div>
                    <div className="text-sm font-bold ltr-nums">
                      {searchResult.totalViolationsCount ?? violations.length}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background px-3 py-2 text-center">
                    <div className="text-[11px] text-muted-foreground">الحجوزات</div>
                    <div className="text-sm font-bold ltr-nums">
                      {searchResult.totalImpoundsCount ?? impoundHistory.length}
                    </div>
                  </div>
                  {currentStatusLabel && currentStatusLabel !== "" ? (
                    <div className="rounded-lg border bg-background px-3 py-2 text-center">
                      <div className="text-[11px] text-muted-foreground">الحالة الحالية</div>
                      <div className="text-sm font-bold">{currentStatusLabel}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {activeImpound && (
              <div className="rounded-xl border border-destructive/30 bg-card p-4 shadow-sm sm:p-5">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive sm:text-base">
                  <AlertTriangle className="h-4 w-4" /> تفاصيل الحجز الحالي
                </h4>
                <Card className="overflow-hidden border bg-background/70 shadow-sm">
                  <CardContent className="grid gap-3 sm:grid-cols-2 p-4">
                    {Object.entries(activeImpound).map(([key, value]) => (
                      <div key={key} className="rounded-lg border bg-card p-3">
                        <div className="text-xs text-muted-foreground">{getDisplayLabel(key)}</div>
                        <div className="mt-1 break-words font-medium">{formatDisplayValue(key, value)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold sm:text-base">
                <Clock className="h-4 w-4 text-muted-foreground" /> بيانات المركبة الكاملة
              </h4>
              {vehicleData ? (
                <Card className="overflow-hidden border bg-background/70 shadow-sm">
                  <CardContent className="grid gap-3 sm:grid-cols-2 p-4">
                    {Object.entries(vehicleData).map(([key, value]) => (
                      <div key={key} className="rounded-lg border bg-card p-3">
                        <div className="text-xs text-muted-foreground">{getDisplayLabel(key)}</div>
                        <div className="mt-1 break-words font-medium">{formatDisplayValue(key, value)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد بيانات مركبة في الرد.</p>
              )}
            </div>

            {violations.length > 0 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                <h4 className="mb-3 text-sm font-semibold sm:text-base">المخالفات</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {violations.map((item, index) => (
                    <Card key={`${item.id ?? index}`} className="overflow-hidden border bg-background/70 shadow-sm">
                      <CardHeader className="gap-2 border-b p-3">
                        <CardTitle className="text-sm font-semibold">مخالفة #{index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 p-4">
                        {Object.entries(item).map(([key, value]) => (
                          <div key={key} className="rounded-lg border bg-card p-3">
                            <div className="text-xs text-muted-foreground">{getDisplayLabel(key)}</div>
                            <div className="mt-1 break-words font-medium">{formatDisplayValue(key, value)}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {impoundHistory.length > 0 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
                <h4 className="mb-3 text-sm font-semibold sm:text-base">سجل الحجوزات</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {impoundHistory.map((item, index) => (
                    <Card key={`${item.id ?? index}`} className="overflow-hidden border bg-background/70 shadow-sm">
                      <CardHeader className="gap-2 border-b p-3">
                        <CardTitle className="text-sm font-semibold">حجز #{index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-3 p-4">
                        {Object.entries(item).map(([key, value]) => (
                          <div key={key} className="rounded-lg border bg-card p-3">
                            <div className="text-xs text-muted-foreground">{getDisplayLabel(key)}</div>
                            <div className="mt-1 break-words font-medium">{formatDisplayValue(key, value)}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

         
          </div>
        ) : searched ? (
          <EmptyState
            title="لم يتم العثور على المركبة"
            description="تأكد من صحة رقم اللوحة ونوعها والمحافظة المدخلة."
          />
        ) : (
          <EmptyState
            title="ابدأ بالبحث"
            description="أدخل تفاصيل لوحة المركبة لعرض سجلها الكامل وحالة حجزها."
          />
        )}
      </div>
    </div>
  );
}

export default SearchVehiclePage;
