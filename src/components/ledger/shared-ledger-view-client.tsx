"use client";

import { useState } from "react";
import { formatCurrency, toBengaliNumber } from "@/lib/utils";
import {
  Download,
  Printer,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  Table,
  FileText,
  ShieldCheck,
  Layers,
  ArrowRight,
  Loader2,
} from "lucide-react";

export interface SharedLedgerContribution {
  amountPaid: number;
  paymentMethod: string;
}

export interface SharedLedgerMember {
  id: string;
  name: string;
  phone: string;
  classRoll?: string | null;
  studentGroup?: string | null;
  committedAmount?: number | null;
  contributions: Record<string, number>; // monthYear -> verified amount
}

export interface SharedLedgerViewClientProps {
  token: string;
  fundTitle: string;
  months: string[];
  members: SharedLedgerMember[];
  columnTotals: Record<string, number>;
  grandTotal: number;
  lastUpdatedAtFormatted: string;
  lastUpdatedByName: string;
}

export function SharedLedgerViewClient({
  token,
  fundTitle,
  months,
  members,
  columnTotals,
  grandTotal,
  lastUpdatedAtFormatted,
  lastUpdatedByName,
}: SharedLedgerViewClientProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"spreadsheet" | "chunked">("spreadsheet");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
  );

  // Chunk months into groups of 4 for print-safe tables
  const chunkSize = 4;
  const chunks: string[][] = [];
  for (let i = 0; i < months.length; i += chunkSize) {
    chunks.push(months.slice(i, i + chunkSize));
  }

  // Precompute totals per member
  const memberGrandTotals: Record<string, number> = {};
  const memberLastPaidMonth: Record<string, string> = {};
  members.forEach((m) => {
    let sum = 0;
    let lastMonth = "-";
    months.forEach((month) => {
      const paid = m.contributions[month] || 0;
      if (paid > 0) {
        sum += paid;
        lastMonth = month;
      }
    });
    memberGrandTotals[m.id] = sum;
    memberLastPaidMonth[m.id] = lastMonth;
  });

  const totalCommitted = members.reduce(
    (acc, m) => acc + (m.committedAmount ? Number(m.committedAmount) : 0),
    0
  );

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const url = `/api/ledger/share/${token}?format=pdf`;
      const res = await fetch(url);
      if (!res.ok) {
        // Fallback to opening printable HTML if PDF service is temporarily unavailable
        window.open(`/api/ledger/share/${token}?format=html`, "_blank");
        return;
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Ledger-${fundTitle.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.warn("Direct PDF download failed, falling back to print view:", e);
      window.open(`/api/ledger/share/${token}?format=html`, "_blank");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ক্রম", "সদস্যের নাম", "মোবাইল নম্বর", "রোল", "মাসিক ওয়াদা", ...months, "সর্বমোট পরিশোধ"];
    const rows = filteredMembers.map((m, idx) => {
      const monthValues = months.map((month) => m.contributions[month] || 0);
      return [
        idx + 1,
        `"${m.name}"`,
        `"${m.phone.startsWith("offline_") ? "সংরক্ষিত নেই" : m.phone}"`,
        m.classRoll ? `"${m.classRoll}"` : "-",
        m.committedAmount || 0,
        ...monthValues,
        memberGrandTotals[m.id] || 0,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ledger-${fundTitle}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Last Updated Info & Audit Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-xs font-bold border border-emerald-700/60 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>পাবলিক শেয়ারকৃত অফিসিয়াল লেজার</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {fundTitle}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              দাখিল ২০১২ ব্যাচ খুলনা আলিয়া মাদ্রাসার কেন্দ্রীয় স্প্রেডশিট লেজার। স্বচ্ছতা নিশ্চিতকরণে সদস্যদের মাসিক ওয়াদা ও পরিশোধের রিয়েলটাইম স্থিতি।
            </p>
          </div>

          {/* Last Updated metadata badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 shadow-lg shrink-0 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-200">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>
                সর্বশেষ আপডেট:{" "}
                <strong className="text-amber-300 font-bold font-mono">
                  {lastUpdatedAtFormatted}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>
                হালনাগাদ করেছেন:{" "}
                <strong className="text-white font-bold">
                  {lastUpdatedByName}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">মোট তালিকাভুক্ত</span>
            <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">
              {toBengaliNumber(members.length)} জন
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">মাসিক মোট ওয়াদা</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-100 mt-0.5 block">
              {formatCurrency(totalCommitted)}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">সর্বমোট আদায়</span>
            <span className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5 block">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">মোট হিসাবের মাস</span>
            <span className="text-lg sm:text-xl font-bold text-white mt-0.5 block">
              {toBengaliNumber(months.length)}টি মাস
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="সদস্যের নাম বা ফোন দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-60 md:w-72"
            />
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            {toBengaliNumber(filteredMembers.length)} জন প্রদর্শিত
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("spreadsheet")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                viewMode === "spreadsheet"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>স্প্রেডশিট ভিউ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chunked")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                viewMode === "chunked"
                  ? "bg-white text-emerald-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>৩-৪ মাসের খণ্ড ভিউ (প্রিন্ট-সেফ)</span>
            </button>
          </div>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition shadow-xs disabled:opacity-50"
            title="নিখুঁত লেআউটে PDF ফাইল হিসেবে ডাউনলোড করুন"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>PDF তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>PDF ডাউনলোড</span>
              </>
            )}
          </button>

          {/* Native Print button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition shadow-xs"
            title="ব্রাউজার প্রিন্টার বা সেভ-অ্যাজ-পিডিএফ ডায়ালগ খুলুন"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>প্রিন্ট / সেভ</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="এক্সেল বা সিএসভি ফাইলে এক্সপোর্ট করুন"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* View 1: Standard Horizontal Spreadsheet View */}
      {viewMode === "spreadsheet" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-emerald-700" />
              সম্পূর্ণ ধারাবাহিক স্প্রেডশিট লেজার গ্রিড
            </span>
            <span className="text-[11px] text-slate-400">
              ডানে স্ক্রোল করে সব মাসের হিসাব দেখুন
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-900 text-white font-medium border-b border-emerald-950">
                  <th className="py-3 px-3 text-center w-12 sticky left-0 z-20 bg-emerald-900 border-r border-emerald-800">
                    নং
                  </th>
                  <th className="py-3 px-4 sticky left-12 z-20 bg-emerald-900 min-w-[190px] border-r border-emerald-800">
                    সদস্যের নাম ও পরিচয়
                  </th>
                  <th className="py-3 px-3 text-center min-w-[100px] border-r border-emerald-800">
                    মাসিক ওয়াদা
                  </th>
                  {months.map((m) => (
                    <th
                      key={m}
                      className="py-3 px-3 text-center min-w-[105px] border-r border-emerald-800 whitespace-nowrap"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right min-w-[120px] bg-emerald-950 font-bold">
                    সর্বমোট পরিশোধ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member, idx) => {
                  const memberTotal = memberGrandTotals[member.id] || 0;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono sticky left-0 z-10 bg-white border-r border-slate-100">
                        {toBengaliNumber(idx + 1)}
                      </td>
                      <td className="py-2.5 px-4 sticky left-12 z-10 bg-white border-r border-slate-100 font-semibold text-slate-900">
                        <div>
                          <span>{member.name}</span>
                          {member.classRoll && (
                            <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                              #{member.classRoll}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-100 font-semibold text-slate-700">
                        {member.committedAmount ? formatCurrency(member.committedAmount) : "-"}
                      </td>
                      {months.map((month) => {
                        const paid = member.contributions[month] || 0;
                        return (
                          <td
                            key={month}
                            className="py-2.5 px-2 text-center border-r border-slate-100"
                          >
                            {paid > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {formatCurrency(paid)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 text-right font-extrabold text-emerald-900 bg-slate-50/60">
                        {formatCurrency(memberTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                  <td
                    colSpan={2}
                    className="py-3 px-4 sticky left-0 z-10 bg-slate-100 border-r border-slate-300 text-right pr-4"
                  >
                    মোট সংকলন (মাসিক যোগফল):
                  </td>
                  <td className="py-3 px-3 text-center border-r border-slate-300 text-slate-700 font-bold">
                    {formatCurrency(totalCommitted)}
                  </td>
                  {months.map((m) => (
                    <td
                      key={m}
                      className="py-3 px-2 text-center border-r border-slate-300 text-emerald-800 font-bold"
                    >
                      {formatCurrency(columnTotals[m] || 0)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right text-emerald-950 font-black bg-slate-200 text-sm">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Chunked View (3-4 Months per Table) for Zero-Clipping Print & PDF */}
      {viewMode === "chunked" && (
        <div className="space-y-8">
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>প্রিন্ট-সেফ খণ্ড ভিউ:</strong> এখানে প্রতি ৪ মাস পর পর নতুন টেবিল সাজানো হয়েছে যাতে কাগজের প্রস্থে কোনো কলাম বা ডাটা কেটে না যায়।
              </span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-emerald-800 text-white rounded-lg text-xs font-bold hover:bg-emerald-900 shrink-0 ml-3"
            >
              প্রিন্ট করুন
            </button>
          </div>

          {chunks.map((chunk, chunkIdx) => {
            const chunkTitle = `খণ্ড ${toBengaliNumber(chunkIdx + 1)}: ${chunk[0]} হতে ${chunk[chunk.length - 1]}`;

            return (
              <div
                key={chunkIdx}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs print:border-slate-400 print:shadow-none print:break-inside-avoid"
              >
                <div className="bg-emerald-950 text-white p-3.5 px-5 flex items-center justify-between font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-300" />
                    {chunkTitle}
                  </span>
                  <span className="text-[11px] text-emerald-300">
                    পর্ব {toBengaliNumber(chunkIdx + 1)}/{toBengaliNumber(chunks.length)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-white font-medium border-b border-emerald-950">
                        <th className="py-2.5 px-3 text-center w-12 border-r border-emerald-800">নং</th>
                        <th className="py-2.5 px-4 min-w-[200px] border-r border-emerald-800">
                          সদস্যের নাম ও রোল
                        </th>
                        <th className="py-2.5 px-3 text-center min-w-[90px] border-r border-emerald-800">
                          মাসিক ওয়াদা
                        </th>
                        {chunk.map((m) => (
                          <th
                            key={m}
                            className="py-2.5 px-3 text-center min-w-[100px] border-r border-emerald-800"
                          >
                            {m}
                          </th>
                        ))}
                        <th className="py-2.5 px-4 text-right min-w-[110px] bg-emerald-950 font-bold">
                          এই খণ্ডের মোট
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((member, idx) => {
                        let memberChunkTotal = 0;
                        const monthCells = chunk.map((m) => {
                          const paid = member.contributions[m] || 0;
                          memberChunkTotal += paid;
                          return (
                            <td key={m} className="py-2 px-2 text-center border-r border-slate-100">
                              {paid > 0 ? (
                                <span className="font-bold text-emerald-800 text-[11px]">
                                  {formatCurrency(paid)}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        });

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-100">
                              {toBengaliNumber(idx + 1)}
                            </td>
                            <td className="py-2 px-4 border-r border-slate-100 font-semibold text-slate-900">
                              {member.name}
                              {member.classRoll && (
                                <span className="text-[10px] text-slate-400 font-mono ml-1">
                                  #{member.classRoll}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-slate-100 font-semibold text-slate-600">
                              {member.committedAmount ? formatCurrency(member.committedAmount) : "-"}
                            </td>
                            {monthCells}
                            <td className="py-2 px-4 text-right font-bold text-emerald-900 bg-slate-50/50">
                              {formatCurrency(memberChunkTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
                        <td colSpan={3} className="py-2.5 px-4 text-right pr-4 border-r border-slate-300">
                          মোট সংকলন (এই খণ্ড):
                        </td>
                        {chunk.map((m) => (
                          <td
                            key={m}
                            className="py-2.5 px-2 text-center border-r border-slate-300 text-emerald-800 font-bold"
                          >
                            {formatCurrency(columnTotals[m] || 0)}
                          </td>
                        ))}
                        <td className="py-2.5 px-4 text-right text-emerald-950 font-black bg-slate-200">
                          {formatCurrency(
                            chunk.reduce((sum, m) => sum + (columnTotals[m] || 0), 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand Summary Section in Chunked view */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs print:break-inside-avoid">
            <div className="bg-slate-900 text-white p-3.5 px-5 font-bold text-xs">
              সার্বিক সারসংক্ষেপ ও চূড়ান্ত পরিশোধ স্থিতি (সকল খণ্ড একত্রে)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-12 border-r border-slate-200">নং</th>
                    <th className="py-2.5 px-4 border-r border-slate-200">সদস্যের নাম</th>
                    <th className="py-2.5 px-4 border-r border-slate-200">মোবাইল নম্বর</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">মাসিক ওয়াদা</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-200">সর্বশেষ জমার মাস</th>
                    <th className="py-2.5 px-4 text-right bg-slate-200">সর্বমোট পরিশোধ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((member, idx) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono border-r border-slate-100">
                        {toBengaliNumber(idx + 1)}
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-900 border-r border-slate-100">
                        {member.name}
                      </td>
                      <td className="py-2 px-4 font-mono text-slate-600 border-r border-slate-100">
                        {member.phone.startsWith("offline_") ? "সংরক্ষিত নেই" : member.phone}
                      </td>
                      <td className="py-2 px-3 text-center border-r border-slate-100 font-semibold text-slate-600">
                        {member.committedAmount ? formatCurrency(member.committedAmount) : "-"}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-100">
                        {memberLastPaidMonth[member.id] || "-"}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-emerald-800 bg-emerald-50/30">
                        {formatCurrency(memberGrandTotals[member.id] || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold text-sm">
                    <td colSpan={5} className="py-3 px-4 text-right pr-4">
                      তহবিলের সর্বমোট আদায়কৃত অর্থ (Grand Total Collection):
                    </td>
                    <td className="py-3 px-4 text-right text-amber-300 font-black">
                      {formatCurrency(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Audit & Verification Footer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <p className="font-bold text-slate-800">
            দাখিল ২০১২ ব্যাচ • খুলনা আলিয়া মাদ্রাসা
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            সেন্ট্রাল ফান্ড একাউন্টস ও ডিজিটাল নিরীক্ষা ব্যবস্থাপনা পোর্টাল
          </p>
        </div>
        <div className="text-right">
          <p>
            সর্বশেষ আপডেট: <strong className="text-slate-800">{lastUpdatedAtFormatted}</strong>
          </p>
          <p className="text-[11px] text-slate-400">
            আপডেটকারী: <strong className="text-slate-700">{lastUpdatedByName}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
