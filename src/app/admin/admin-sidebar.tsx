"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth-actions";
import {
  LayoutDashboard,
  Table,
  HeartHandshake,
  CheckCircle,
  Receipt,
  Users,
  Bell,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name: string;
    role: string;
    phone: string;
  };
  pendingPaymentsCount: number;
}

export function AdminSidebar({ user, pendingPaymentsCount }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const navigation = [
    { name: "ওভারভিউ ড্যাশবোর্ড", href: "/admin", icon: LayoutDashboard },
    { name: "স্প্রেডশিট লেজার ভিউ", href: "/admin/ledger", icon: Table },
    {
      name: "পেমেন্ট অনুমোদন",
      href: "/admin/payments",
      icon: CheckCircle,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
    },
    { name: "তহবিলসমূহ", href: "/admin/funds", icon: HeartHandshake },
    { name: "খরচ ও সহায়তা ব্যয়", href: "/admin/expenses", icon: Receipt },
    {
      name: "সদস্য ও পারমিশন (RBAC)",
      href: "/admin/members",
      icon: Users,
      superOnly: true,
    },
    { name: "নোটিশ বোর্ড", href: "/admin/notices", icon: Bell },
    {
      name: "অডিট ট্রেইল ও লগ",
      href: "/admin/logs",
      icon: History,
      superOnly: true,
    },
    {
      name: "হোমপেজ সেটিংস",
      href: "/admin/settings",
      icon: Settings,
      superOnly: true,
    },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/";
  };

  return (
    <aside
      className={`bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 flex flex-col shrink-0 h-full overflow-hidden z-30 no-print ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              ১২
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">অ্যাডমিন প্যানেল</p>
              <p className="text-[10px] text-emerald-400 font-medium">দাখিল ২০১২ ব্যাচ</p>
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-auto"
          title={collapsed ? "সাইডবার বড় করুন" : "সাইডবার ছোট করুন"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Info Capsule */}
      {!collapsed && (
        <div className="p-3 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
              {isSuperAdmin ? (
                <>
                  <ShieldAlert className="w-3 h-3" /> সুপার অ্যাডমিন
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" /> ফান্ড ম্যানেজার
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          if (item.superOnly && !isSuperAdmin) return null;
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? "bg-emerald-700 text-white font-bold shadow-xs"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate flex-1">{item.name}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition ${
            collapsed ? "justify-center" : ""
          }`}
          title="মূল ওয়েবসাইট"
        >
          <Home className="w-4 h-4 shrink-0" />
          {!collapsed && <span>মূল ওয়েবসাইট</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition ${
            collapsed ? "justify-center" : ""
          }`}
          title="লগআউট"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>লগআউট</span>}
        </button>
      </div>
    </aside>
  );
}
