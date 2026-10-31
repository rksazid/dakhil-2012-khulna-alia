import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
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

  // Check if current user has an active commitment
  let userCommitment = null;
  if (session) {
    userCommitment = await prisma.fundCommitment.findUnique({
      where: {
        fundId_userId: { fundId: fund.id, userId: session.userId },
      },
    });
  }

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
              <span className="text-xl font-bold text-amber-300 block">
                {formatCurrency(currentBalance)}
              </span>
            </div>
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3 rounded-xl border border-emerald-700/60">
              <span className="text-[11px] text-emerald-200 block">সর্বমোট আদায়</span>
              <span className="text-xl font-bold text-white block">
                {formatCurrency(totalCollected)}
              </span>
            </div>
            <div className="bg-emerald-800/50 backdrop-blur-xs p-3 rounded-xl border border-emerald-700/60">
              <span className="text-[11px] text-emerald-200 block">মানবিক সহায়তায় ব্যয়</span>
              <span className="text-xl font-bold text-white block">
                {formatCurrency(totalSpent)}
              </span>
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
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
              {fund.rules || (
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
                সর্বমোট ব্যয়: {formatCurrency(totalSpent)}
              </span>
            </div>

            {fund.expenses.length === 0 ? (
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

        {/* Right Column: Payment Instructions & Management Contacts */}
        <div className="space-y-6">
          {/* Contribution CTA / Member Commitment */}
          <div className="bg-emerald-900 text-white rounded-2xl p-6 border border-emerald-800 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">চাঁদা বা অনুদান প্রদানের নিয়ম</h3>
            </div>

            <p className="text-xs text-emerald-100 leading-relaxed">
              নিচের নির্ধারিত একাউন্ট নম্বরে আপনার মাসিক কিস্তি বা স্বেচ্ছামূলক অনুদান প্রেরণ করুন।
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

            <div className="pt-2">
              {session ? (
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
                >
                  <UserCheck className="w-4 h-4" />
                  ড্যাশবোর্ডে চাঁদা এন্ট্রি দিন
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition"
                  >
                    লগইন করে চাঁদা রেকর্ড করুন
                  </Link>
                  <p className="text-[11px] text-center text-emerald-300">
                    লগইন ছাড়া ট্রানজেকশন এন্ট্রি সংরক্ষিত হবে না।
                  </p>
                </div>
              )}
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
      </main>

      <Footer />
    </div>
  );
}
