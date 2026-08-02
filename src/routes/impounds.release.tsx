import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Unlock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleService } from "@/api/vehicleService";
import { impoundService } from "@/api/impoundService";

export const Route = createFileRoute("/impounds/release")({
  head: () => ({
    meta: [
      { title: "الإفراج عن مركبة" },
      { name: "description", content: "الإفراج عن مركبة محجوزة بعد استيفاء المتطلبات." },
    ],
  }),
  component: ReleasePage,
});

const PLATE_TYPE_LABELS: Record<string, string> = {
  "1": "خصوصي",
  "2": "أجرة",
  "3": "نقل",
};

function ReleasePage() {
  const [plateNumber, setPlateNumber] = useState("");
  const [governorateNumber, setGovernorateNumber] = useState("1");
  const [plateType, setPlateType] = useState("1");

  const [foundVehicle, setFoundVehicle] = useState<any | null>(null);
  const [foundImpound, setFoundImpound] = useState<any | null>(null);

  const [fineAmount, setFineAmount] = useState<number | "">("");
  const [receiptNumber, setReceiptNumber] = useState<number | "">("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [releasedByUserId, setReleasedByUserId] = useState<number | "">("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const search = async () => {
    if (!plateNumber) {
      toast.error("أدخل رقم اللوحة للبحث");
      return;
    }
    setSearching(true);
    setFoundVehicle(null);
    setFoundImpound(null);

    try {
      // استدعاء خدمة البحث
      const res = await vehicleService.search({
        PlateNumber: plateNumber,
        GovernorateNumber: governorateNumber,
        PlateType: plateType,
      });

      console.log("Search Response:", res); // للفحص عبر المتصفح (F12)

      // استخراج البيانات بغض النظر عن طريقة إرجاعها (مصفوفة أو كائن أو غلاف)
      const data = Array.isArray(res) ? res[0] : res;

      if (!data) {
        toast.error("لم يتم العثور على المركبة في النظام");
        return;
      }

      // 1. إذا كان الرد يحمل غلاف بحث مركبة متكامل (مثل SearchVehicleResponse)
      let vehicleObj = data.vehicle || data.Vehicle || data;
      let activeImpoundObj = data.activeImpound || data.ActiveImpound;

      setFoundVehicle(vehicleObj);

      // 2. التحقق من وجود حجز نشط
      if (activeImpoundObj) {
        setFoundImpound(activeImpoundObj);
        toast.success("تم العثور على المركبة والحجز النشط بنجاح");
      } else {
        // إذا لم يكن موجوداً بشكل مباشر، نحاول جلبه عبر خدمة الحجوزات كخيار احتياطي
        try {
          const imp = await impoundService.list({ 
            searchTerm: String(vehicleObj.plateNumber || plateNumber), 
            status: 1, 
            pageNumber: 1, 
            pageSize: 1 
          });
          const item = imp?.data && imp.data.length ? imp.data[0] : null;
          
          if (item) {
            setFoundImpound(item);
            toast.success("تم العثور على الحجز النشط بنجاح");
          } else {
            toast.warning("المركبة موجودة ولكن لا يوجد لها حجز نشط حالياً");
          }
        } catch {
          toast.warning("المركبة موجودة ولكن تعذر التحقق من الحجز النشط");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "خطأ في الاتصال أثناء البحث عن المركبة");
    } finally {
      setSearching(false);
    }
  };

  const doRelease = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!foundVehicle) { toast.error("ابحث عن المركبة أولاً"); return; }
    if (!foundImpound) { toast.error("لا يوجد حجز نشط للإفراج"); return; }

    setSubmitting(true);
    try {
      const payload = {
        plateNumber: Number(foundVehicle.plateNumber || foundVehicle.PlateNumber || plateNumber),
        governorateNumber: Number(foundVehicle.governorateNumber || foundVehicle.GovernorateNumber || governorateNumber),
        plateType: Number(foundVehicle.plateType || foundVehicle.PlateType || plateType),
        fineAmount: Number(fineAmount) || 0,
        receiptNumber: Number(receiptNumber) || 0,
        releaseNotes: releaseNotes || null,
        releasedByUserId: Number(releasedByUserId) || 0,
      };

      await impoundService.releaseByRequest(payload);
      toast.success("تم الإفراج عن المركبة بنجاح");

      // إعادة تعيين الحقول
      setFoundVehicle(null);
      setFoundImpound(null);
      setPlateNumber("");
      setGovernorateNumber("1");
      setPlateType("1");
      setFineAmount("");
      setReceiptNumber("");
      setReleaseNotes("");
      setReleasedByUserId("");
    } catch (err: any) {
      toast.error(err?.message || "فشل عملية الإفراج");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-2">
      <PageHeader title="الإفراج عن مركبة" description="ابحث عن المركبة بواسطة رقم اللوحة ثم أكمل بيانات الإفراج." />

      <div className="space-y-5 rounded-xl border bg-card p-5 md:p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label className="text-xs">رقم اللوحة</Label>
            <Input 
              value={plateNumber} 
              onChange={(e) => setPlateNumber(e.target.value.replace(/\D/g, ""))} 
              placeholder="2356" 
              className="ltr-nums font-semibold" 
            />
          </div>
          <div>
            <Label className="text-xs">الفاصل (المحافظة)</Label>
            <Input 
              value={governorateNumber} 
              onChange={(e) => setGovernorateNumber(e.target.value.replace(/\D/g, ""))} 
              placeholder="1" 
              className="ltr-nums font-semibold" 
            />
          </div>
          <div>
            <Label className="text-xs">نوع اللوحة</Label>
            <Select value={plateType} onValueChange={(v) => setPlateType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">خصوصي</SelectItem>
                <SelectItem value="2">أجرة</SelectItem>
                <SelectItem value="3">نقل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={search} disabled={searching}>
            {searching ? 'جاري البحث...' : 'بحث بالمركبة'}
          </Button>
        </div>

        {/* عرض بيانات المركبة والحجز فور توفرها */}
        {foundVehicle && (
          <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
            <h4 className="text-sm font-bold text-primary">بيانات المركبة:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground block">رقم اللوحة:</span>
                <span className="font-bold ltr-nums text-sm">
                  {foundVehicle.plateNumber || foundVehicle.PlateNumber}-{foundVehicle.governorateNumber || foundVehicle.GovernorateNumber}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">نوع اللوحة:</span>
                <span className="font-medium">
                  {PLATE_TYPE_LABELS[String(foundVehicle.plateType || foundVehicle.PlateType)] || foundVehicle.plateType}
                </span>
              </div>
            </div>
          </div>
        )}

        {foundImpound && (
          <div className="space-y-4 rounded-xl border p-4 bg-card">
            <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
              معلومات الحجز الحالي (جاهز للإفراج)
            </h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="text-xs">المبلغ (ريال يمني)</Label>
                <Input type="number" value={String(fineAmount)} onChange={(e) => setFineAmount(e.target.value === '' ? '' : Number(e.target.value))} className="ltr-nums" />
              </div>
              <div>
                <Label className="text-xs">رقم السند</Label>
                <Input type="number" value={String(receiptNumber)} onChange={(e) => setReceiptNumber(e.target.value === '' ? '' : Number(e.target.value))} className="ltr-nums" />
              </div>
            </div>

            <div>
              <Label className="text-xs">ملاحظات الإفراج</Label>
              <Textarea rows={3} value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)} placeholder="أدخل أي ملاحظات إضافية هنا..." />
            </div>

            {/* <div>
              <Label className="text-xs">رقم المستخدم الذي أفاد الإفراج (اختياري)</Label>
              <Input type="number" value={String(releasedByUserId)} onChange={(e) => setReleasedByUserId(e.target.value === '' ? '' : Number(e.target.value))} className="ltr-nums" />
            </div> */}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setFoundVehicle(null); setFoundImpound(null); }}>إلغاء</Button>
              <Button onClick={(e) => doRelease(e)} disabled={submitting}>
                {submitting ? 'جارٍ التنفيذ...' : <><Unlock className="h-4 w-4 ml-1" /> تأكيد الإفراج</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReleasePage;