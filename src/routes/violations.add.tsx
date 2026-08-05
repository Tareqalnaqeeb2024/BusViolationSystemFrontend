import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "sonner";
import { Save } from "lucide-react";
import { violationService } from "@/api/violationService";

export const Route = createFileRoute("/violations/add")({
  head: () => ({
    meta: [
      { title: "تسجيل مخالفة" },
      { name: "description", content: "سجل مخالفة مركبة جديدة بتفاصيل اللوحة ونوع المخالفة." },
    ],
  }),
  component: AddViolationPage,
});

const schema = z.object({
  plateType: z.enum(["أجرة", "خصوصي", "شحن"]),
  plateNumber: z.string().regex(/^\d+$/, "أرقام فقط"),
  plateSuffix: z.string().regex(/^\d+$/, "أرقام فقط"),
  vehicleType: z.string().min(1, "نوع المركبة مطلوب"),
  violationType: z.string().min(1, "نوع المخالفة مطلوب"),
  notes: z.string().optional(),
});
type Data = z.infer<typeof schema>;

const PLATE_TYPE_VALUES: Record<string, number> = {
  "أجرة": 2,
  خصوصي: 1,
  شحن: 3,
};

const VEHICLE_TYPE_VALUES: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
};

const VIOLATION_TYPE_VALUES: Record<string, number> = {
  "نظام فرزة": 1,
  "تشكيل فرزة": 2,
  "عرقلة حركة السير": 3,
  "مستهتر": 4,
  "العمل في غير خطه": 5,
  "بدون طبعة خط": 6,
  "عاكس خط": 7,
};

function AddViolationPage() {
  const defaults: Data = {
    plateType: "أجرة",
    plateNumber: "",
    plateSuffix: "1",
    vehicleType: "2", // باص كافتراضي
    violationType: "نظام فرزة",
    notes: "",
  };
  const plateRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Data>({ resolver: zodResolver(schema), defaultValues: defaults });

  const plateType = watch("plateType");
  const vehicleType = watch("vehicleType");
  const violationType = watch("violationType");
  const plateReg = register("plateNumber");

  useEffect(() => {
    plateRef.current?.focus();
  }, []);

  const onSubmit = async (data: Data) => {
    try {
      const payload = {
        PlateNumber: Number(data.plateNumber),
        GovernorateNumber: Number(data.plateSuffix) || 1,
        PlateType: PLATE_TYPE_VALUES[data.plateType] ?? 2,
        VehicleType: VEHICLE_TYPE_VALUES[data.vehicleType] ?? 2,
        ViolationType: VIOLATION_TYPE_VALUES[data.violationType] ?? 1,
        ViolationDate: new Date().toISOString(),
        Notes: data.notes?.trim() ? data.notes.trim() : undefined,
        UserId: 1,
      };

      await violationService.register(payload);
      toast.success("تم تسجيل المخالفة بنجاح");

      reset(defaults);
      setTimeout(() => plateRef.current?.focus(), 0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "تعذر تسجيل المخالفة";
      toast.error("فشل تسجيل المخالفة", { description: message });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="تسجيل مخالفة" description="أدخل بيانات المخالفة الجديدة." />
      <div className="rounded-xl border bg-card p-5 md:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
            <div className="space-y-1.5">
              <Label className="text-xs">نوع اللوحة</Label>
              <Select
                value={plateType}
                onValueChange={(v) => setValue("plateType", v as Data["plateType"], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="أجرة">أجرة</SelectItem>
                  <SelectItem value="خصوصي">خصوصي</SelectItem>
                  <SelectItem value="شحن">شحن</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">رقم اللوحة</Label>
            <div className="flex items-center gap-2" dir="ltr">
              <Input
                {...plateReg}
                ref={(el) => {
                  plateReg.ref(el);
                  plateRef.current = el;
                }}
                inputMode="numeric"
                placeholder="2356"
                className="ltr-nums h-11 w-40 text-lg font-bold"
                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""); }}
              />
              <span className="text-xl font-bold text-muted-foreground">-</span>
              <Input
                {...register("plateSuffix")}
                inputMode="numeric"
                className="ltr-nums h-11 w-20 text-lg font-bold"
                onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""); }}
              />
            </div>
            {(errors.plateNumber || errors.plateSuffix) && (
              <p className="text-xs text-destructive">
                {errors.plateNumber?.message || errors.plateSuffix?.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">نوع المركبة</Label>
              <Select
                value={vehicleType}
                onValueChange={(v) => setValue("vehicleType", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المركبة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">باص</SelectItem>
                  <SelectItem value="1">سيارة خاصة</SelectItem>
                  <SelectItem value="3">شاحنة</SelectItem>
                  <SelectItem value="4">دراجة نارية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع المخالفة</Label>
              <Select
                value={violationType}
                onValueChange={(v) => setValue("violationType", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="نظام فرزة">نظام فرزة</SelectItem>
                  <SelectItem value="تشكيل فرزة">تشكيل فرزة</SelectItem>
                  <SelectItem value="عرقلة حركة السير">عرقلة حركة السير</SelectItem>
                  <SelectItem value="مستهتر">مستهتر</SelectItem>
                  <SelectItem value="العمل في غير خطه">العمل في غير خطه</SelectItem>
                  <SelectItem value="بدون طبعة خط">بدون طبعة خط</SelectItem>
                  <SelectItem value="عاكس خط">عاكس خط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">ملاحظات</Label>
            <Textarea rows={3} placeholder="ملاحظات إضافية…" {...register("notes")} />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" /> حفظ المخالفة
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}