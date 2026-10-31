import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import {
  CreditCard,
  HeartHandshake,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  User,
  Settings,
  Shield,
  FileSpreadsheet,
} from "lucide-react";
import { MemberDashboardClient } from "./member-dashboard-client";


export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user's commitments
  const commitments = await prisma.fundCommitment.findMany({
    where: { userId: user.id },
    include: {
      fund: { select: { id: true, title: true, slug: true, bankDetails: true } },
    },
  });

  // 2. Fetch user's contributions
  const contributions = await prisma.monthlyContribution.findMany({
    where: { userId: user.id },
    include: {
      fund: { select: { title: true, slug: true } },
      verifiedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch all active funds for commitment selection or contribution payment
  const allFunds = await prisma.fund.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      slug: true,
      bankDetails: true,
      contactPerson: true,
      contactPhone: true,
    },
  });

  // Aggregates
  const totalVerified = contributions
    .filter((c) => c.status === "VERIFIED")
    .reduce((sum, c) => sum + Number(c.amountPaid), 0);

  const pendingCount = contributions.filter((c) => c.status === "PENDING").length;

  const totalMonthlyPledged = commitments
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + Number(c.committedAmount), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        session={{
          userId: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-700 text-emerald-200">
                {user.role === "SUPER_ADMIN"
                  ? "সুপার অ্যাডমিন"
                  : user.role === "FUND_MANAGER"
                  ? "তহবিল ব্যবস্থাপক"
                  : "সম্মানিত ব্যাচমেট"}
              </span>
              <span className="text-xs text-emerald-300">• দাখিল ২০১২ ব্যাচ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{user.name}</h1>
            <p className="text-xs sm:text-sm text-emerald-100">
              আপনার ব্যক্তিগত ফান্ড ড্যাশবোর্ড ও মাসিক চাঁদা ট্র্যাকার
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "SUPER_ADMIN" || user.role === "FUND_MANAGER" ? (
              <a
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-sm"
              >
                <Shield className="w-4 h-4" />
                ম্যানেজমেন্ট প্যানেলে যান
              </a>
            ) : null}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">আমার মোট পরিশোধিত চাঁদা</p>
              <h3 className="text-2xl font-black text-emerald-800 mt-1">
                {formatCurrency(totalVerified)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">যাচাইকৃত প্রাপ্তি</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">মাসিক সক্রিয় প্রতিশ্রুতি</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(totalMonthlyPledged)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">প্রতি মাসে প্রদেয়</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">অপেক্ষমান ট্রানজেকশন</p>
              <h3 className="text-2xl font-black text-amber-700 mt-1">
                {toBengaliNumber(pendingCount)}টি
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">ভেরিফিকেশনের জন্য প্রসেসিংয়ে</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Client Interactive Area (Payment Submission, Pledges, History, Profile) */}
        <MemberDashboardClient
          user={user}
          commitments={commitments.map((c) => ({
            ...c,
            committedAmount: Number(c.committedAmount),
          }))}
          contributions={contributions.map((c) => ({
            ...c,
            amountPaid: Number(c.amountPaid),
          }))}
          funds={allFunds}
        />
      </main>

      <Footer />
    </div>
  );
}
