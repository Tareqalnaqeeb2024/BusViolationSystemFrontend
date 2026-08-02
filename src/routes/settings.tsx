import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات" },
      { name: "description", content: "إعدادات النظام والحساب والإشعارات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="الإعدادات" description="إدارة إعدادات النظام والحساب." />

      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">الاتصال بالخادم</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">عنوان الـ API</Label>
            <Input defaultValue="http://localhost:5206/api" className="ltr-nums" dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">مهلة الاتصال (ثواني)</Label>
            <Input defaultValue={20} type="number" className="ltr-nums" dir="ltr" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">التفضيلات</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm">تفعيل الإشعارات</p>
              <p className="text-xs text-muted-foreground">استقبل تنبيهات فورية عن المخالفات الجديدة.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm">التركيز التلقائي على رقم اللوحة</p>
              <p className="text-xs text-muted-foreground">تحديد حقل رقم اللوحة عند فتح صفحة التسجيل.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </section>

      <div>
        <Button onClick={() => toast.success("تم حفظ الإعدادات")}>حفظ التغييرات</Button>
      </div>
    </div>
  );
}
