import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ShieldAlert, Menu, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NAV_GROUPS } from "@/constants/nav";
import { getToken } from "@/api/apiClient";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";





function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">الرابط الذي طلبته غير متاح.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول مرة أخرى.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            إعادة المحاولة
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "لوحة التحكم — نظام إدارة المخالفات والحجز" },
      { name: "description", content: "نظام احترافي لإدارة مخالفات المركبات والحجز والإفراج مع إحصائيات لحظية." },
      { property: "og:title", content: "نظام إدارة المخالفات والحجز" },
      { property: "og:description", content: "لوحة تحكم لإدارة مخالفات المركبات وعمليات الحجز والإفراج." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function BrandBlock() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <ShieldAlert className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-sidebar-primary"> إدارة المخالفات </div>
        <div className="truncate text-[11px] text-sidebar-foreground/60"> نظام الحجز والإفراج </div>
      </div>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter((i) => i.group === group.key);
        return (
          <div key={group.key}>
            <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {items.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname === n.to || pathname.startsWith(n.to + "/");
                const Icon = n.icon;
                return (
                  <Link key={n.to} to={n.to} onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{n.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function DesktopSidebar() {
  return (
    <aside className="hidden shrink-0 border-l border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-64 md:flex-col">
      <BrandBlock />
      <div className="border-b border-sidebar-border" />
      <SidebarNav />
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-sidebar-accent">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12px] text-sidebar-foreground/90">مدير النظام</div>
            <div className="truncate text-[10px]">admin@traffic.gov</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV_ITEMS.find((n) => n.to === "/" ? pathname === "/" : pathname === n.to || pathname.startsWith(n.to + "/"));
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="grid h-9 w-9 place-items-center rounded-md border bg-card text-foreground/70 md:hidden" aria-label="فتح القائمة">
            <Menu className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-l border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <BrandBlock />
          <div className="border-b border-sidebar-border" />
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground"> {current?.label ?? "لوحة التحكم"} </div>
        <div className="hidden truncate text-[11px] text-muted-foreground sm:block"> الإدارة العامة للمرور — نظام إدارة المخالفات والحجز </div>
      </div>
      <button className="grid h-9 w-9 place-items-center rounded-md border bg-card text-foreground/70 hover:bg-muted" aria-label="الإشعارات">
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const token = getToken();
  const isAuthenticated = Boolean(token);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isAuthenticated && !isLoginPage) {
      navigate({ to: "/login", replace: true });
    } else if (isAuthenticated && isLoginPage) {
      navigate({ to: "/", replace: true });
    }
  }, [isAuthenticated, isLoginPage, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen w-full bg-background">
        {isAuthenticated && <DesktopSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {isAuthenticated && <TopBar />}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
          <footer className="border-t px-4 py-3 text-center text-[11px] text-muted-foreground md:px-6">
            © الإدارة العامة للمرور — الحملة المرورية
          </footer>
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

export default Route;