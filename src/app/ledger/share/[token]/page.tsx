import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { sortMonthYears } from "@/lib/months";
import { formatBengaliDateTime } from "@/lib/utils";
import { PaymentStatus } from "@prisma/client";
import {
  SharedLedgerViewClient,
  SharedLedgerMember,
} from "@/components/ledger/shared-ledger-view-client";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface SharedLedgerPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharedLedgerPageProps): Promise<Metadata> {
  const { token } = await params;
  const link = await prisma.ledgerShareLink.findUnique({
    where: { token },
    include: { fund: { select: { title: true } } },
  });

  const title = link?.fund?.title
    ? `${link.fund.title} • অফিসিয়াল স্প্রেডশিট লেজার`
    : "অফিসিয়াল স্প্রেডশিট লেজার • দাখিল ২০১২ ব্যাচ খুলনা আলিয়া";

  return {
    title: `${title} | দাখিল ২০১২ ব্যাচ খুলনা আলিয়া`,
    description: "দাখিল ২০১২ ব্যাচ খুলনা আলিয়া মাদ্রাসার কেন্দ্রীয় স্বচ্ছ মাসিক চাঁদা ও অনুদান লেজার বিবরণী।",
  };
}

export default async function SharedLedgerPage({ params }: SharedLedgerPageProps) {
  const { token } = await params;
  const session = await getSession();

  const shareLink = await prisma.ledgerShareLink.findUnique({
    where: { token },
    include: {
      fund: true,
    },
  });

  if (!shareLink || !shareLink.fund) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar session={session} />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            শেয়ার লিঙ্কটি পাওয়া যায়নি
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            এই লেজার লিঙ্কটি বৈধ নয় অথবা অ্যাডমিন কর্তৃক স্থায়ীভাবে মুছে ফেলা হয়েছে।
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> মূল হোমপেজে ফিরে যান
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!shareLink.isActive) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar session={session} />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-200 text-slate-700 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            শেয়ার লিঙ্কটি সাময়িকভাবে স্থগিত
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            এই লেজারের পাবলিক লিঙ্কটি তহবিল অ্যাডমিন বা কমিটির সিদ্ধান্ত মোতাবেক সাময়িকভাবে নিষ্ক্রিয় রাখা হয়েছে।
          </p>
          <Link
            href="/funds"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> তহবিলসমূহ দেখুন
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const fund = shareLink.fund;

  // 1. Fetch distinct months recorded
  const dbContributions = await prisma.monthlyContribution.findMany({
    where: { fundId: fund.id, status: PaymentStatus.VERIFIED },
    select: { monthYear: true },
    distinct: ["monthYear"],
  });

  const baseMonths = ["অক্টোবর-২৬", "নভেম্বর-২৬", "ডিসেম্বর-২৬", "জানুয়ারি-২৭", "ফেব্রুয়ারি-২৭", "মার্চ-২৭"];
  const allMonthsSet = new Set<string>([...baseMonths]);
  dbContributions.forEach((c) => {
    if (c.monthYear) allMonthsSet.add(c.monthYear);
  });
  const months = sortMonthYears(Array.from(allMonthsSet));

  // 2. Fetch all members with their commitments and verified contributions
  const members = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      phone: true,
      classRoll: true,
      studentGroup: true,
      commitments: {
        where: { fundId: fund.id },
        select: { committedAmount: true },
      },
      contributions: {
        where: { fundId: fund.id, status: PaymentStatus.VERIFIED },
        select: { monthYear: true, amountPaid: true },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  // Calculate Column Totals
  const columnTotals: Record<string, number> = {};
  months.forEach((m) => {
    columnTotals[m] = 0;
  });

  const sharedMembers: SharedLedgerMember[] = members.map((m) => {
    const contributionMap: Record<string, number> = {};
    m.contributions.forEach((c) => {
      const amt = Number(c.amountPaid);
      contributionMap[c.monthYear] = amt;
      columnTotals[c.monthYear] = (columnTotals[c.monthYear] || 0) + amt;
    });

    return {
      id: m.id,
      name: m.name,
      phone: m.phone,
      classRoll: m.classRoll,
      studentGroup: m.studentGroup,
      committedAmount: m.commitments[0]?.committedAmount
        ? Number(m.commitments[0].committedAmount)
        : null,
      contributions: contributionMap,
    };
  });

  const grandTotal = Object.values(columnTotals).reduce((a, b) => a + b, 0);

  // 3. Find latest update time and who updated it
  const latestActivity = await prisma.activityLog.findFirst({
    where: {
      fundId: fund.id,
      entityType: { in: ["CONTRIBUTION", "MONTHLY_CONTRIBUTION", "PAYMENT", "COMMITMENT", "LEDGER"] },
    },
    orderBy: { timestamp: "desc" },
    include: { performedBy: { select: { name: true, role: true } } },
  });

  const latestContribution = await prisma.monthlyContribution.findFirst({
    where: { fundId: fund.id },
    orderBy: { updatedAt: "desc" },
    include: { verifiedBy: { select: { name: true, role: true } } },
  });

  let lastUpdatedAt = shareLink.updatedAt;
  let lastUpdatedByName = "ফান্ড ম্যানেজমেন্ট টিম";

  if (latestActivity?.timestamp && latestActivity.timestamp > lastUpdatedAt) {
    lastUpdatedAt = latestActivity.timestamp;
    if (latestActivity.performedBy?.name) {
      lastUpdatedByName = latestActivity.performedBy.name;
    }
  } else if (latestContribution?.updatedAt && latestContribution.updatedAt > lastUpdatedAt) {
    lastUpdatedAt = latestContribution.updatedAt;
    if (latestContribution.verifiedBy?.name) {
      lastUpdatedByName = latestContribution.verifiedBy.name;
    }
  }

  const lastUpdatedAtFormatted = formatBengaliDateTime(lastUpdatedAt);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-200">
      <Navbar session={session} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <SharedLedgerViewClient
          token={token}
          fundTitle={fund.title}
          months={months}
          members={sharedMembers}
          columnTotals={columnTotals}
          grandTotal={grandTotal}
          lastUpdatedAtFormatted={lastUpdatedAtFormatted}
          lastUpdatedByName={lastUpdatedByName}
        />
      </main>

      <Footer />
    </div>
  );
}
