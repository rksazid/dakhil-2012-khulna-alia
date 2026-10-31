import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import {
  TrendingUp,
  HeartHandshake,
  Users,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Table,
  Plus,
  History,
} from "lucide-react";


export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // 1. Funds
  const funds = await prisma.fund.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { commitments: true, contributions: true } },
    },
  });

  // 2. Collections and Expenses
  const verifiedAgg = await prisma.monthlyContribution.aggregate({
    where: { status: "VERIFIED" },
    _sum: { amountPaid: true },
  });

  const expenseAgg = await prisma.fundExpense.aggregate({
    _sum: { amount: true },
  });

  const totalCollected = Number(verifiedAgg._sum.amountPaid || 0);
  const totalSpent = Number(expenseAgg._sum.amount || 0);
  const netBalance = funds.reduce((sum, f) => sum + Number(f.currentBalance), 0);
  const memberCount = await prisma.user.count({ where: { isActive: true } });

  // 3. Pending Contributions
  const pendingContributions = await prisma.monthlyContribution.findMany({
    where: { status: "PENDING" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
      fund: { select: { title: true } },
    },
  });

  // 4. Recent Audit Logs
  const recentLogs = await prisma.activityLog.findMany({
    take: 6,
    orderBy: { timestamp: "desc" },
    include: {
      performedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            অ্যাডমিন ওভারভিউ ও পরিসংখ্যান
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            তহবিল স্থিতি, নিয়মিত মাসিক চাঁদা আদায় এবং সার্বিক অডিট নিরীক্ষা
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/ledger"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            <Table className="w-4 h-4" />
            স্প্রেডশিট লেজার ওপেন করুন
          </Link>
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            পেমেন্ট অনুমোদন
          </Link>
          <Link
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            সহায়তা খরচ এন্ট্রি
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">বর্তমান মোট তহবিল স্থিতি</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(netBalance)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">সকল ফান্ড যৌথ ব্যালেন্স</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">সর্বমোট সংগৃহীত চাঁদা</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">যাচাইকৃত পূর্ণাঙ্গ জমা</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">মানবিক সহায়তায় ব্যয়</span>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(totalSpent)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">চিকিৎসা ও কল্যাণ প্রজেক্ট</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">নিবন্ধিত ব্যাচমেট</span>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {toBengaliNumber(memberCount)} জন
          </p>
          <span className="text-[11px] text-slate-400 font-medium">সক্রিয় ডিরেক্টরি প্রোফাইল</span>
        </div>
      </div>

      {/* Two Column Layout: Pending Payments & Fund Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pending Payments for quick approval */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                অপেক্ষমান চাঁদা অনুমোদন কিউ ({toBengaliNumber(pendingContributions.length)})
              </h3>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              সবগুলো দেখুন →
            </Link>
          </div>

          {pendingContributions.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              বর্তমানে কোনো পেন্ডিং পেমেন্ট অনুমোদনের জন্য অপেক্ষমান নেই।
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingContributions.map((c) => (
                <div
                  key={c.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{c.user.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.fund.title} • {c.monthYear} •{" "}
                      <span className="font-semibold text-slate-700">{c.paymentMethod}</span>
                      {c.transactionId && ` (Trx: ${c.transactionId})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-emerald-800">
                      {formatCurrency(c.amountPaid)}
                    </span>
                    <Link
                      href="/admin/payments"
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition"
                    >
                      অনুমোদন দিন
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Fund Balances */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">তহবিল অনুযায়ী স্থিতি</h3>
            <Link
              href="/admin/funds"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              তহবিল ব্যবস্থাপনা →
            </Link>
          </div>

          <div className="space-y-4">
            {funds.map((f) => (
              <div key={f.id} className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{f.title}</span>
                  <span className="font-black text-emerald-800">
                    {formatCurrency(f.currentBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>প্রতিশ্রুতিবদ্ধ: {toBengaliNumber(f._count.commitments)} জন</span>
                  <span>{f.isActive ? "সক্রিয়" : "স্থগিত"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log Snippet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">
              সাম্প্রতিক অডিট ট্রেইল ও কার্যক্রম লগ
            </h3>
          </div>
          <Link
            href="/admin/logs"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            সম্পূর্ণ অডিট লগ দেখুন →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.map((log) => {
            let detailsObj: { summary?: string } = {};
            try {
              if (log.details) detailsObj = JSON.parse(log.details);
            } catch {
              // ignore
            }

            return (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-sm text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-slate-600 font-medium">
                      {detailsObj.summary || log.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    সম্পাদনকারী: {log.performedBy?.name || "সিস্টেম"}
                  </p>
                </div>

                <span className="text-[11px] text-slate-400 shrink-0">
                  {formatBengaliDate(log.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
