import {
  LayoutDashboard,
  Search,
  PlusCircle,
  FileText,
  Car,
  Unlock,
  Archive,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "operations" | "system";
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard, group: "main" },
  { to: "/vehicles/search", label: "البحث عن مركبة", icon: Search, group: "main" },

  { to: "/violations/add", label: "تسجيل مخالفة", icon: PlusCircle, group: "operations" },
  { to: "/violations", label: "سجل المخالفات", icon: FileText, group: "operations" },
  { to: "/impounds/register", label: "حجز مركبة", icon: Car, group: "operations" },
  { to: "/impounds/release", label: "الإفراج", icon: Unlock, group: "operations" },
  { to: "/impounds", label: "سجل الحجوزات", icon: Archive, group: "operations" },

  { to: "/settings", label: "الإعدادات", icon: Settings, group: "system" },
];

export const NAV_GROUPS: { key: NavItem["group"]; label: string }[] = [
  { key: "main", label: "الرئيسية" },
  { key: "operations", label: "العمليات" },
  { key: "system", label: "النظام" },
];
