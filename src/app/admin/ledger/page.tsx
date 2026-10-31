import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser, canManageFund } from "@/lib/auth";
import { SpreadsheetLedger, LedgerMember, LedgerContribution } from "@/components/ledger/spreadsheet-ledger";
import { formatCurrency, toBengaliNumber } from "@/lib/utils";
import { Table, Filter, Plus, ArrowRight } from "lucide-react";

interface AdminLedgerPageProps {
  searchParams: Promise<{ fundId?: string; year?: string }>;
}


export default async function AdminLedgerPage({ searchParams }: AdminLedgerPageProps) {
  const { fundId: queryFundId } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  // 1. Fetch all funds
  const funds = await prisma.fund.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, slug: true, currentBalance: true },
  });

  if (funds.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
        <p className="text-slate-600 font-semibold">কোনো সক্রিয় তহবিল পাওয়া যায়নি।</p>
        <Link
          href="/admin/funds"
          className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          নতুন তহবিল তৈরি করুন
        </Link>
      </div>
    );
  }

  // Selected Fund
  const selectedFund = funds.find((f) => f.id === queryFundId) || funds[0];
  const canEdit = await canManageFund(user.id, selectedFund.id);

  // Dynamic Months list (Bengali months for current batch cycle)
  const months = [
    "অক্টোবর-২৬",
    "নভেম্বর-২৬",
    "ডিসেম্বর-২৬",
    "জানুয়ারি-২৭",
    "ফেব্রুয়ারি-২৭",
    "মার্চ-২৭",
  ];

  // 2. Fetch all members with their commitments and contributions for this fund
  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      avatarUrl: true,
      commitments: {
        where: { fundId: selectedFund.id },
        select: { committedAmount: true },
      },
      contributions: {
        where: { fundId: selectedFund.id },
        select: {
          id: true,
          monthYear: true,
          amountPaid: true,
          paymentMethod: true,
          status: true,
          transactionId: true,
          note: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  // Transform data for 2D Spreadsheet Ledger
  const ledgerMembers: LedgerMember[] = members.map((m) => {
    const contributionMap: Record<string, LedgerContribution> = {};
    m.contributions.forEach((c) => {
      contributionMap[c.monthYear] = {
        id: c.id,
        monthYear: c.monthYear,
        amountPaid: Number(c.amountPaid),
        paymentMethod: c.paymentMethod,
        status: c.status,
        transactionId: c.transactionId,
        note: c.note,
      };
    });

    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      avatarUrl: m.avatarUrl,
      committedAmount: m.commitments[0]?.committedAmount
        ? Number(m.commitments[0].committedAmount)
        : null,
      contributions: contributionMap,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header and Fund Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                স্প্রেডশিট-স্টাইল মাসিক লেজার ভিউ
              </h1>
              <p className="text-xs text-slate-500">
                এক নজরে সকল সদস্যের প্রতি মাসের চাঁদা প্রদান স্থিতি ও দ্রুত ইনলাইন সেল আপডেট
              </p>
            </div>
          </div>
        </div>

        {/* Fund Picker Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-xl border border-slate-300">
          {funds.map((f) => (
            <Link
              key={f.id}
              href={`/admin/ledger?fundId=${f.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedFund.id === f.id
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Selected Fund Status Bar */}
      <div className="bg-emerald-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <span className="text-[11px] text-emerald-200 font-medium">নির্বাচিত তহবিল:</span>
          <h2 className="text-base font-bold text-white">{selectedFund.title}</h2>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-emerald-200 block text-[10px]">মোট তহবিল স্থিতি:</span>
            <span className="font-extrabold text-amber-300 text-sm">
              {formatCurrency(selectedFund.currentBalance)}
            </span>
          </div>

          <div>
            <span className="text-emerald-200 block text-[10px]">তালিকাভুক্ত সদস্য:</span>
            <span className="font-extrabold text-white text-sm">
              {toBengaliNumber(ledgerMembers.length)} জন
            </span>
          </div>
        </div>
      </div>

      {/* The 2D Dynamic Spreadsheet Component */}
      <SpreadsheetLedger
        fundId={selectedFund.id}
        fundTitle={selectedFund.title}
        months={months}
        members={ledgerMembers}
        canEdit={canEdit}
      />
    </div>
  );
}
