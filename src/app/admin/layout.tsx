import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== Role.SUPER_ADMIN && user.role !== Role.FUND_MANAGER) {
    redirect("/dashboard");
  }

  // Count pending payments
  const pendingPaymentsCount = await prisma.monthlyContribution.count({
    where: { status: "PENDING" },
  });

  return (
    <div className="h-screen w-screen flex bg-slate-100 text-slate-900 overflow-hidden">
      {/* Sticky, Fixed Sidebar */}
      <AdminSidebar
        user={{
          name: user.name,
          role: user.role,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          thumbnailUrl: user.thumbnailUrl,
        }}
        pendingPaymentsCount={pendingPaymentsCount}
      />

      {/* Main Content Area: Fixed Height with Sticky Navbar & Scrollable Body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Top Navbar / Header */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20 no-print">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              দাখিল ২০১২ ব্যাচ ম্যানেজমেন্ট কনসোল
            </h2>
            <p className="text-[11px] text-slate-500">
              খুলনা আলিয়া মাদ্রাসা • পূর্ণাঙ্গ অডিট ও জবাবদিহিতা
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>সিস্টেম লাইভ ও সক্রিয়</span>
            </div>
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>মূল ওয়েবসাইট</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Body Only */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
