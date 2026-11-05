"use client";

import { useState, useTransition, useEffect } from "react";
import { formatCurrency, toBengaliNumber } from "@/lib/utils";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { updateLedgerCellAction } from "@/actions/ledger-actions";
import {
  getNextMonthYear,
  sortMonthYears,
  BENGALI_MONTHS,
  formatMonthYear,
} from "@/lib/months";
import {
  Search,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  CalendarPlus,
} from "lucide-react";

export interface LedgerContribution {
  id: string;
  monthYear: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string | null;
  note?: string | null;
}

export interface LedgerMember {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string | null;
  thumbnailUrl?: string | null;
  committedAmount?: number | null;
  contributions: Record<string, LedgerContribution>;
}

export interface SpreadsheetLedgerProps {
  fundId: string;
  fundTitle: string;
  months: string[];
  members: LedgerMember[];
  canEdit: boolean;
}

export function SpreadsheetLedger({
  fundId,
  fundTitle,
  months,
  members,
  canEdit,
}: SpreadsheetLedgerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [monthsList, setMonthsList] = useState<string[]>(months);
  const [isAddMonthModalOpen, setIsAddMonthModalOpen] = useState(false);
  const [customMonthIndex, setCustomMonthIndex] = useState<number>(0);
  const [customYear, setCustomYear] = useState<number>(2027);

  // Sync if prop updates
  useEffect(() => {
    setMonthsList((prev) => {
      const merged = new Set([...prev, ...months]);
      return sortMonthYears(Array.from(merged));
    });
  }, [months]);

  const lastMonth = monthsList[monthsList.length - 1] || "মার্চ-২৭";
  const nextMonth = getNextMonthYear(lastMonth);

  const handleAddNextMonth = () => {
    if (!monthsList.includes(nextMonth)) {
      setMonthsList((prev) => [...prev, nextMonth]);
    }
  };

  const handleAddCustomMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = formatMonthYear(customMonthIndex, customYear);
    if (!monthsList.includes(formatted)) {
      setMonthsList((prev) => sortMonthYears([...prev, formatted]));
    }
    setIsAddMonthModalOpen(false);
  };

  const [selectedCell, setSelectedCell] = useState<{
    member: LedgerMember;
    month: string;
    contribution?: LedgerContribution;
  } | null>(null);

  // Cell edit form states
  const [editAmount, setEditAmount] = useState<number>(500);
  const [editMethod, setEditMethod] = useState<PaymentMethod>(PaymentMethod.BKASH);
  const [editStatus, setEditStatus] = useState<PaymentStatus>(PaymentStatus.VERIFIED);
  const [isPending, startTransition] = useTransition();

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  // Calculate Column Totals (Verified amounts only)
  const columnTotals: Record<string, number> = {};
  monthsList.forEach((m) => {
    columnTotals[m] = members.reduce((sum, member) => {
      const c = member.contributions[m];
      return c && c.status === PaymentStatus.VERIFIED ? sum + Number(c.amountPaid) : sum;
    }, 0);
  });

  const grandTotal = Object.values(columnTotals).reduce((a, b) => a + b, 0);

  const openCellModal = (member: LedgerMember, month: string) => {
    if (!canEdit) return;
    const existing = member.contributions[month];
    setSelectedCell({ member, month, contribution: existing });
    setEditAmount(existing ? Number(existing.amountPaid) : Number(member.committedAmount || 500));
    setEditMethod(existing ? existing.paymentMethod : PaymentMethod.BKASH);
    setEditStatus(existing ? existing.status : PaymentStatus.VERIFIED);
  };

  const handleSaveCell = () => {
    if (!selectedCell) return;
    startTransition(async () => {
      await updateLedgerCellAction(
        fundId,
        selectedCell.member.id,
        selectedCell.month,
        editAmount,
        editStatus,
        editMethod
      );
      setSelectedCell(null);
    });
  };

  const handleExportCSV = () => {
    const headers = ["সদস্যের নাম", "মোবাইল নম্বর", "অঙ্গীকার", ...monthsList, "মোট পরিশোধিত"];
    const rows = filteredMembers.map((m) => {
      let totalMemberPaid = 0;
      const monthValues = monthsList.map((month) => {
        const c = m.contributions[month];
        if (c && c.status === PaymentStatus.VERIFIED) {
          totalMemberPaid += Number(c.amountPaid);
          return c.amountPaid;
        }
        return 0;
      });
      return [
        `"${m.name}"`,
        `"${m.phone}"`,
        m.committedAmount || 0,
        ...monthValues,
        totalMemberPaid,
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
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Controls Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 no-print">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="সদস্যের নাম বা ফোন দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-56 md:w-64"
            />
          </div>
          <span className="text-xs text-slate-500 bg-slate-200/70 px-2 py-1 rounded-md">
            মোট {toBengaliNumber(filteredMembers.length)} জন
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleAddNextMonth}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-2xs"
                title={`পরবর্তী মাস ${nextMonth} কলাম হিসেবে যুক্ত করুন`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>পরবর্তী মাস ({nextMonth})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddMonthModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition shadow-2xs"
                title="যেকোনো কাস্টম মাস নির্বাচন করুন"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>কাস্টম মাস...</span>
              </button>
            </div>
          )}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            এক্সেল / CSV এক্সপোর্ট
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            প্রিন্ট ভিউ
          </button>
        </div>
      </div>

      {/* Spreadsheet 2D Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-emerald-900 text-white font-medium border-b border-emerald-950">
              <th className="py-3 px-4 sticky left-0 z-20 bg-emerald-900 min-w-[200px] border-r border-emerald-800">
                সদস্যের নাম ও তথ্য
              </th>
              <th className="py-3 px-3 text-center min-w-[100px] border-r border-emerald-800">
                প্রতিশ্রুতি (মাসিক)
              </th>
              {monthsList.map((month) => (
                <th
                  key={month}
                  className="py-3 px-3 text-center min-w-[110px] border-r border-emerald-800 whitespace-nowrap"
                >
                  {month}
                </th>
              ))}
              {canEdit && (
                <th className="py-2 px-2 text-center min-w-[50px] border-r border-emerald-800/80 no-print">
                  <button
                    type="button"
                    onClick={handleAddNextMonth}
                    className="p-1 rounded bg-emerald-800/90 hover:bg-emerald-700 text-emerald-200 hover:text-white transition"
                    title={`পরবর্তী মাস কলাম যোগ করুন (${nextMonth})`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </th>
              )}
              <th className="py-3 px-4 text-right min-w-[120px] bg-emerald-950">
                মোট আদায়
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((member, idx) => {
              let memberTotal = 0;
              return (
                <tr
                  key={member.id}
                  className={idx % 2 === 0 ? "bg-white hover:bg-slate-50/80" : "bg-slate-50/40 hover:bg-slate-50"}
                >
                  {/* Sticky Member Column */}
                  <td className="py-2.5 px-4 sticky left-0 z-10 bg-inherit border-r border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-200">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                        {member.phone.startsWith("offline_") ? (
                          <span className="text-[10px] text-amber-800 font-sans font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            অফলাইন সদস্য
                          </span>
                        ) : (
                          <p className="text-[11px] text-slate-500 font-mono">{member.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Monthly Commitment */}
                  <td className="py-2.5 px-3 text-center text-slate-700 font-medium border-r border-slate-100">
                    {member.committedAmount ? formatCurrency(member.committedAmount) : "—"}
                  </td>

                  {/* Dynamic Month Cells */}
                  {monthsList.map((month) => {
                    const c = member.contributions[month];
                    if (c && c.status === PaymentStatus.VERIFIED) {
                      memberTotal += Number(c.amountPaid);
                    }

                    return (
                      <td
                        key={month}
                        onClick={() => openCellModal(member, month)}
                        className={`py-2.5 px-2 text-center border-r border-slate-100 transition-colors ${
                          canEdit ? "cursor-pointer hover:bg-emerald-50/60" : ""
                        }`}
                      >
                        {c ? (
                          c.status === PaymentStatus.VERIFIED ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {formatCurrency(c.amountPaid)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {formatCurrency(c.amountPaid)}
                            </span>
                          )
                        ) : canEdit ? (
                          <span className="inline-flex items-center gap-0.5 text-slate-300 hover:text-emerald-600 font-medium text-[11px]">
                            <Plus className="w-3 h-3" />
                            এন্ট্রি
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    );
                  })}

                  {canEdit && (
                    <td className="py-2 px-2 text-center border-r border-slate-100 bg-slate-50/30 no-print">
                      <span className="text-[10px] text-slate-300">—</span>
                    </td>
                  )}

                  {/* Member Total Paid */}
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 bg-slate-50/50">
                    {formatCurrency(memberTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Summary Row */}
          <tfoot>
            <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
              <td className="py-3 px-4 sticky left-0 z-10 bg-slate-100 border-r border-slate-300">
                মোট আদায় (মাসিক সংকলন)
              </td>
              <td className="py-3 px-3 text-center border-r border-slate-300">—</td>
              {monthsList.map((month) => (
                <td
                  key={month}
                  className="py-3 px-2 text-center border-r border-slate-300 text-emerald-800 font-bold"
                >
                  {formatCurrency(columnTotals[month] || 0)}
                </td>
              ))}
              {canEdit && (
                <td className="py-3 px-2 text-center border-r border-slate-300 no-print">
                  <span className="text-slate-400">—</span>
                </td>
              )}
              <td className="py-3 px-4 text-right text-emerald-900 font-extrabold bg-slate-200">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Inline Fast Modal for Cell Edit */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">চাঁদা এন্ট্রি ও হালনাগাদ</h4>
                  <p className="text-xs text-slate-500">
                    {selectedCell.member.name} • {selectedCell.month}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={PaymentMethod.BKASH}>bKash (বিকাশ)</option>
                    <option value={PaymentMethod.NAGAD}>Nagad (নগদ)</option>
                    <option value={PaymentMethod.ROCKET}>Rocket (রকেট)</option>
                    <option value={PaymentMethod.BANK}>Bank (ব্যাংক ট্রান্সফার)</option>
                    <option value={PaymentMethod.CASH}>Cash (নগদ গ্রহণ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্ট্যাটাস
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as PaymentStatus)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={PaymentStatus.VERIFIED}>VERIFIED (যাচাইকৃত)</option>
                    <option value={PaymentStatus.PENDING}>PENDING (অপেক্ষমান)</option>
                    <option value={PaymentStatus.REJECTED}>REJECTED (বাতিল)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              {selectedCell.contribution?.id ? (
                <a
                  href={`/api/receipts/${selectedCell.contribution.id}`}
                  target="_blank"
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
                  title="এই সেলের ডিজিটাল রশিদ ডাউনলোড করুন"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>রশিদ (PDF)</span>
                </a>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSaveCell}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Month Column */}
      {isAddMonthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">লেজারে নতুন মাসের কলাম যোগ</h4>
              </div>
              <button
                onClick={() => setIsAddMonthModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomMonth} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মাস নির্বাচন করুন
                </label>
                <select
                  value={customMonthIndex}
                  onChange={(e) => setCustomMonthIndex(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {BENGALI_MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সাল (ইংরেজি বছর)
                </label>
                <select
                  value={customYear}
                  onChange={(e) => setCustomYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white font-mono"
                >
                  {[2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>
                      {toBengaliNumber(y)} ({formatMonthYear(customMonthIndex, y)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                লেজারে নতুন কলাম যুক্ত হবে: <strong className="font-bold text-emerald-950">{formatMonthYear(customMonthIndex, customYear)}</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMonthModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
                >
                  কলাম যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
