import { redirect } from "next/navigation";
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
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              সার্ভারলেস ডাটাবেজ: <strong className="text-emerald-700">Neon PostgreSQL</strong>
            </span>
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
