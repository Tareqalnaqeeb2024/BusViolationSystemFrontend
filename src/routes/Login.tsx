import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert, Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getToken, setToken, setUserInfo } from "@/api/apiClient";

const ADMIN_ROLES = ["admin", "1"];
const OFFICER_ROLES = ["officer", "2", "traffic", "police"];

function normalizeRole(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return "";
}

function isAdminRole(role: string) {
  return ADMIN_ROLES.includes(role.toLowerCase());
}

function isOfficerRole(role: string) {
  return OFFICER_ROLES.includes(role.toLowerCase());
}

export const Route = createFileRoute("/Login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول" },
      { name: "description", content: "دخول المستخدم إلى نظام إدارة المخالفات والحجز." },
    ],
  }),
  component: LoginPage,
});

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const role = normalizeRole(localStorage.getItem("userRole"));
    if (token && role) {
      navigate({ to: isAdminRole(role) ? "/" : "/violations/add" });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !password) {
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5206/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName, password }),
      });
      const data = await res.json();

      if (res.ok) {
        const role = normalizeRole(data.role);

        const displayName = data.fullName || data.username || userName;
        const loginUsername = data.username || userName;

        setToken(data.token);
        setUserInfo({
          fullName: displayName,
          userName: loginUsername,
          role,
        });
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", displayName);
        localStorage.setItem("username", loginUsername);
        localStorage.setItem(
          "loginSession",
          JSON.stringify({
            token: data.token,
            username: loginUsername,
            fullName: displayName,
            role,
          }),
        );

        toast.success("تم تسجيل الدخول بنجاح");

        if (isAdminRole(role)) {
          navigate({ to: "/" });
        } else {
          navigate({ to: "/violations/add" });
        }
      } else {
        toast.error(data.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 dir-rtl">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نظام إدارة مخالفات المركبات والحجز
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              اسم المستخدم
            </label>
            <div className="relative">
              <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full rounded-lg border bg-background py-2 pr-9 pl-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border bg-background py-2 pr-9 pl-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}