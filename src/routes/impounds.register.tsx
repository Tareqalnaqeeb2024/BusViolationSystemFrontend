import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Car, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { impoundService } from "@/api/impoundService";

export const Route = createFileRoute("/impounds/register")({
  head: () => ({
    meta: [
      { title: "حجز مركبة" },
      { name: "description", content: "تسجيل حجز مركبة مع سبب الحجز والموقع." },
    ],
  }),
  component: RegisterImpoundPage,
});

// قائمة أسباب الحجز مطابقة للـ Enum في C#
const IMPOUND_REASONS = [
  { value: "1", label: "نظام فرزة" },
  { value: "2", label: "تشكيل فرزة" },
  { value: "3", label: "عرقلة حركة السير" },
  { value: "4", label: "مستهتر" },
  { value: "5", label: "العمل في غير خطه" },
  { value: "6", label: "بدون طبعة خط" },
  { value: "7", label: "حادث" },
  { value: "8", label: "عاكس خط" },
];

function RegisterImpoundPage() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: "",
    governorateNumber: "1",
    plateType: "2",
    vehicleType: "1", // باص
    violationId: "",
    driverName: "",
    impoundReason: "2", // تشكيل فرزة
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. تحويل البيانات لتتطابق مع DTO في C#
    const payload = {
      plateNumber: parseInt(formData.plateNumber, 10),
      governorateNumber: parseInt(formData.governorateNumber, 10),
      plateType: parseInt(formData.plateType, 10),
      vehicleType: parseInt(formData.vehicleType, 10),
      userId: 1, // تأتي من الـ Auth لاحقاً
      impoundDate: new Date().toISOString(),
      driverName: formData.driverName,
      impoundReason: parseInt(formData.impoundReason, 10),
      notes: formData.notes || null,
    };

    // التحقق المبدئي
    if (!payload.plateNumber || !payload.driverName || !payload.vehicleType || !payload.impoundReason) {
      toast.error("الرجاء تعبئة جميع الحقول الإجبارية");
      return;
    }

    try {
      setSubmitting(true);
      // إرسال الطلب إلى الباك إند
      await impoundService.register(payload);
      toast.success("تم تسجيل الحجز بنجاح");
      setFormData((prev) => ({
        ...prev,
        plateNumber: "",
        governorateNumber: "1",
        plateType: "1",
        vehicleType: "",
        violationId: "",
        driverName: "",
        impoundReason: "",
        notes: "",
      }));
    } catch (error: any) {
      toast.error(error?.message || "حدث خطأ أثناء الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="حجز مركبة" description="تسجيل عملية حجز جديدة لمركبة." />
      <form
        className="space-y-6 rounded-xl border bg-card p-5 md:p-6"
        onSubmit={handleSubmit}
      >
        {/* بيانات المركبة الأساسية */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs text-red-500">رقم اللوحة *</Label>
            <Input 
              type="number"
              placeholder="2356" 
              className="ltr-nums font-bold" 
              value={formData.plateNumber}
              onChange={(e) => handleChange("plateNumber", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-red-500">الفاصل *</Label>
            <Input 
              type="number"
              className="ltr-nums font-bold" 
              value={formData.governorateNumber}
              onChange={(e) => handleChange("governorateNumber", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-red-500">نوع اللوحة *</Label>
            <Select value={formData.plateType} onValueChange={(v) => handleChange("plateType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">خصوصي</SelectItem>
                <SelectItem value="2">أجرة</SelectItem>
                <SelectItem value="3">نقل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* تفاصيل السائق والمركبة */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-red-500">اسم السائق *</Label>
            <Input 
              placeholder="الاسم الرباعي" 
              value={formData.driverName}
              onChange={(e) => handleChange("driverName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-red-500">نوع المركبة *</Label>
            <Select value={formData.vehicleType} onValueChange={(v) => handleChange("vehicleType", v)}>
              <SelectTrigger><SelectValue placeholder="اختر نوع المركبة" /></SelectTrigger>
              <SelectContent>
                {/* استبدل هذه الأرقام بما يقابلها في EnVehicleType في الباك إند */}
                <SelectItem value="1">باص</SelectItem>
                <SelectItem value="2">سيارة صغيرة</SelectItem>
                <SelectItem value="3">دراجة نارية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* تفاصيل الحجز والمخالفة */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-red-500">سبب الحجز *</Label>
            <Select value={formData.impoundReason} onValueChange={(v) => handleChange("impoundReason", v)}>
              <SelectTrigger><SelectValue placeholder="-- اختر سبب الحجز --" /></SelectTrigger>
              <SelectContent>
                {IMPOUND_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
       
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">ملاحظات</Label>
          <Textarea 
            rows={3} 
            placeholder="أي ملاحظات إضافية…" 
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} className="gap-2 w-full md:w-auto">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-4 w-4" />}
          {submitting ? "جارٍ تسجيل الحجز..." : "تسجيل الحجز"}
        </Button>
      </form>
    </div>
  );
}