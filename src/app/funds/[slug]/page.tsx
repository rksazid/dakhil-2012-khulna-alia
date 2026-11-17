import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { getDefaultRollingMonths } from "@/lib/months";
import { FundCommitmentCard } from "@/components/funds/fund-commitment-card";
import {
  HeartHandshake,
  ShieldCheck,
  PhoneCall,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Receipt,
  CreditCard,
  UserCheck,
  Lock,
} from "lucide-react";

interface FundDetailPageProps {
  params: Promise<{ slug: string }>;
}


export default async function FundDetailPage({ params }: FundDetailPageProps) {
  const { slug } = await params;
  const session = await getSession();

  const fund = await prisma.fund.findUnique({
    where: { slug },
    include: {
      managers: {
        include: {
          user: {
            select: { id: true, name: true, phone: true, occupation: true },
          },
        },
      },
      expenses: {
        orderBy: { spentDate: "desc" },
        take: 10,
      },
      _count: {
        select: { commitments: true, contributions: true },
      },
    },
  });

  if (!fund) {
    notFound();
  }

  // Aggregate verified collections and total expenses
  const verifiedAgg = await prisma.monthlyContribution.aggregate({
    where: { fundId: fund.id, status: "VERIFIED" },
    _sum: { amountPaid: true },
  });

  const expenseAgg = await prisma.fundExpense.aggregate({
    where: { fundId: fund.id },
    _sum: { amount: true },
  });

  const totalCollected = Number(verifiedAgg._sum.amountPaid || 0);
  const totalSpent = Number(expenseAgg._sum.amount || 0);
  const currentBalance = Number(fund.currentBalance);
  const target = Number(fund.targetAmount || 0);
  const percent = target > 0 ? Math.min(Math.round((currentBalance / target) * 100), 100) : 100;

  const balanceSetting = await prisma.siteSetting.findUnique({
    where: { key: "public_fund_balance_visible" },
  });
  const canViewFinancials = Boolean(session) || balanceSetting?.value === "true";

  // Check if current user has an active commitment
  let userCommitment = null;
  if (session) {
    userCommitment = await prisma.fundCommitment.findUnique({
      where: {
        fundId_userId: { fundId: fund.id, userId: session.userId },
      },
    });
  }

  const serializedUserCommitment = userCommitment
    ? {
        id: userCommitment.id,
        fundId: userCommitment.fundId,
        committedAmount: Number(userCommitment.committedAmount),
        startMonth: userCommitment.startMonth,
        status: userCommitment.status,
      }
    : null;

  const monthOptions = getDefaultRollingMonths(18);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar session={session} />

      {/* Fund Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/funds"
              className="text-xs text-emerald-300 hover:text-white flex items-center gap-1"
            >
              ← সকল তহবিল
            </Link>
            <span className="text-emerald-600">•</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-800 text-amber-300">
              {fund.isActive ? "সক্রিয় তহবিল" : "স্থগিত"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {fund.title}
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed">
            {fund.description || "এই তহবিলের উদ্দেশ্য ও বিস্তারিত তথ্য নিম্নে দেওয়া হলো।"}
          </p>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 max-w-4xl">
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3 rounded-xl border border-emerald-700/60">
              <span className="text-[11px] text-emerald-200 block">বর্তমান তহবিল স্থিতি</span>
              {canViewFinancials ? (
                <span className="text-xl font-bold text-amber-300 block">
                  {formatCurrency(currentBalance)}
                </span>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 mt-1"
                >
                  <Lock className="w-3.5 h-3.5" /> দেখতে লগইন করুন
                </Link>
              )}
            </div>
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3 rounded-xl border border-emerald-700/60">
              <span className="text-[11px] text-emerald-200 block">সর্বমোট আদায়</span>
              {canViewFinancials ? (
                <span className="text-xl font-bold text-white block">
                  {formatCurrency(totalCollected)}
                </span>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white mt-1"
                >
                  <Lock className="w-3.5 h-3.5" /> দেখতে লগইন করুন
                </Link>
              )}
            </div>
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3 rounded-xl border border-emerald-700/60">
              <span className="text-[11px] text-emerald-200 block">মানবিক সহায়তায় ব্যয়</span>
              {canViewFinancials ? (
                <span className="text-xl font-bold text-emerald-100 block">
                  {formatCurrency(totalSpent)}
                </span>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-100/90 hover:text-white mt-1"
                >
                  <Lock className="w-3.5 h-3.5" /> দেখতে লগইন করুন
                </Link>
              )}
            </div>
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3 rounded-xl border border-emerald-700/60">
              <span className="text-[11px] text-emerald-200 block">প্রতিশ্রুতিবদ্ধ সদস্য</span>
              <span className="text-xl font-bold text-white block">
                {toBengaliNumber(fund._count.commitments)} জন
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {!canViewFinancials && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  আর্থিক নিরাপত্তা ও প্রাইভেসি প্রটেকশন
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  তহবিলের পুঙ্খানুপুঙ্খ আর্থিক স্থিতি ও মাসিক লেজার স্টেটমেন্ট দেখতে অনুগ্রহ করে আপনার ব্যাচমেট একাউন্টে লগইন করুন।
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shrink-0 transition"
            >
              লগইন করুন
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Rules, Objectives & Expenses */}
        <div className="lg:col-span-2 space-y-8">
          {/* Rules & Regulations (শর্ত ও নিয়মাবলী) */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">
                তহবিলের উদ্দেশ্য, শর্ত ও নিয়মাবলী
              </h2>
            </div>

            <div className="text-slate-700 leading-relaxed text-xs sm:text-sm">
              {fund.rules ? (
                <MarkdownContent content={fund.rules} />
              ) : (
                <p className="text-slate-500 italic">
                  এই তহবিলের বিশেষ নীতিমালা সাধারণ সভার সিদ্ধান্ত মোতাবেক পরিচালিত হবে।
                </p>
              )}
            </div>
          </div>

          {/* Transparency: Recent Expenditures / Disbursements */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-slate-900">
                  তহবিল ব্যয়ের হিসাব (পাবলিক স্বচ্ছতা বিবরণী)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {canViewFinancials
                  ? `সর্বমোট ব্যয়: ${formatCurrency(totalSpent)}`
                  : "ব্যয়ের হিসাব: সংরক্ষিত"}
              </span>
            </div>

            {!canViewFinancials ? (
              <div className="py-8 text-center space-y-2 bg-slate-50/80 rounded-xl border border-dashed border-slate-200">
                <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  ব্যয়ের পুঙ্খানুপুঙ্খ বিবরণ, রসিদ ও ভাউচার দেখতে লগইন করুন
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline pt-1"
                >
                  সদস্য লগইন করুন →
                </Link>
              </div>
            ) : fund.expenses.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                এই তহবিল থেকে এখনো কোনো খরচ করা হয়নি।
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {fund.expenses.map((expense) => (
                  <div key={expense.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        {expense.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-sm">
                          {expense.category || "সহায়তা"}
                        </span>
                        <span>•</span>
                        <span>{formatBengaliDate(expense.spentDate)}</span>
                        {expense.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600">{expense.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-red-600 shrink-0">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Commitment Card & Payment Instructions & Contacts */}
        <div className="space-y-6">
          {/* Commitment Management Card (Direct Add, Edit, View right on this fund page) */}
          <FundCommitmentCard
            fundId={fund.id}
            fundTitle={fund.title}
            fundSlug={fund.slug}
            isLoggedIn={!!session}
            initialCommitment={serializedUserCommitment}
            monthOptions={monthOptions}
            bankDetails={fund.bankDetails}
          />

          {/* Payment Accounts Card */}
          <div className="bg-emerald-900 text-white rounded-3xl p-6 border border-emerald-800 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">চাঁদা বা অনুদান পাঠানোর হিসাব</h3>
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed">
              নিচের নির্ধারিত একাউন্ট নম্বরে আপনার মাসিক কিস্তি বা স্বেচ্ছামূলক অনুদান প্রেরণ করুন। টাকা পাঠানোর পর উপরের বাটন থেকে সরাসরি এন্ট্রি দিতে পারবেন।
            </p>

            <div className="bg-emerald-950/80 p-4 rounded-xl border border-emerald-800/80 space-y-2 text-xs font-mono">
              <div className="whitespace-pre-line text-emerald-200">
                {fund.bankDetails || (
                  <>
                    বিকাশ (পার্সোনাল): 01711-000002
                    {"\n"}নগদ (পার্সোনাল): 01711-000003
                    {"\n"}ব্যাংক: ইসলামী ব্যাংক বাংলাদেশ পিএলসি
                  </>
                )}
              </div>
            </div>

            <div className="pt-1 text-center">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-emerald-300 hover:text-white underline underline-offset-4"
              >
                সদস্য ড্যাশবোর্ডে পূর্ণাঙ্গ লেজার হিস্ট্রি দেখুন →
              </Link>
            </div>
          </div>

          {/* Fund Managers / Contact Persons */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              তহবিল ব্যবস্থাপনা কমিটি
            </h3>

            {fund.managers.length === 0 ? (
              <p className="text-xs text-slate-500">
                যোগাযোগ: {fund.contactPerson || "কমিটি"} ({fund.contactPhone})
              </p>
            ) : (
              <div className="space-y-3">
                {fund.managers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{m.user.name}</p>
                      <p className="text-[11px] text-slate-500">{m.user.occupation || "ফান্ড ম্যানেজার"}</p>
                    </div>
                    <a
                      href={`tel:${m.user.phone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100"
                    >
                      <PhoneCall className="w-3 h-3" />
                      {m.user.phone}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
