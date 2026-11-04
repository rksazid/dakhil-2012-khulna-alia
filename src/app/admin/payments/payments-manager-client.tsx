"use client";

import { useState, useTransition } from "react";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import { getDefaultRollingMonths } from "@/lib/months";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import {
  verifyContributionAction,
  recordMonthlyContributionAction,
  deleteContributionAction,
} from "@/actions/ledger-actions";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Search,
  Filter,
  Check,
  Receipt,
  User,
  Download,
} from "lucide-react";

interface ContributionData {
  id: string;
  fundId: string;
  userId: string;
  monthYear: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  receiptUrl: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: Date;
  user: { id: string; name: string; phone: string };
  fund: { id: string; title: string };
  verifiedBy?: { id: string; name: string } | null;
}

interface FundOption {
  id: string;
  title: string;
}

interface MemberOption {
  id: string;
  name: string;
  phone: string;
}

export function PaymentsManagerClient({
  contributions,
  funds,
  members,
}: {
  contributions: ContributionData[];
  funds: FundOption[];
  members: MemberOption[];
}) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterFund, setFilterFund] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isDirectEntryOpen, setIsDirectEntryOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Direct entry form states
  const [entryFundId, setEntryFundId] = useState(funds[0]?.id || "");
  const [entryUserId, setEntryUserId] = useState(members[0]?.id || "");
  const [entryMonth, setEntryMonth] = useState("নভেম্বর-২৬");
  const [entryAmount, setEntryAmount] = useState<number>(500);
  const [entryMethod, setEntryMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [entryTrxId, setEntryTrxId] = useState("");
  const [entryNote, setEntryNote] = useState("");

  const monthOptions = getDefaultRollingMonths(18);

  const filtered = contributions.filter((c) => {
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    const matchesFund = filterFund === "ALL" || c.fundId === filterFund;
    const matchesSearch =
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.user.phone.includes(search) ||
      (c.transactionId && c.transactionId.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesFund && matchesSearch;
  });

  const handleVerify = (id: string, status: PaymentStatus) => {
    startTransition(async () => {
      const res = await verifyContributionAction(id, status);
      if (res.success) {
        setFeedback({
          type: "success",
          message: `পেমেন্ট স্ট্যাটাস "${status === "VERIFIED" ? "অনুমোদিত" : "বাতিল"}" করা হয়েছে।`,
        });
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই চাঁদার রেকর্ড মুছে ফেলতে চান? তহবিলের স্থিতি স্বয়ংক্রিয় সমন্বয় হবে।")) return;
    startTransition(async () => {
      const res = await deleteContributionAction(id);
      if (res.success) {
        setFeedback({ type: "success", message: "রেকর্ড মুছে ফেলা হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "মুছে ফেলতে ব্যর্থ।" });
      }
    });
  };

  const handleDirectEntry = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await recordMonthlyContributionAction({
        fundId: entryFundId,
        userId: entryUserId,
        monthYear: entryMonth,
        amountPaid: Number(entryAmount),
        paymentMethod: entryMethod,
        transactionId: entryTrxId || undefined,
        status: PaymentStatus.VERIFIED,
        note: entryNote || "অ্যাডমিন কর্তৃক সরাসরি এন্ট্রি",
      });

      if (res.success) {
        setFeedback({ type: "success", message: "সরাসরি চাঁদা এন্ট্রি ও তহবিল স্থিতি হালনাগাদ সম্পন্ন!" });
        setIsDirectEntryOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "এন্ট্রি ব্যর্থ।" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400">
            ✕
          </button>
        </div>
      )}

      {/* Header & Direct Entry Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            পেমেন্ট অনুমোদন ও সরাসরি চাঁদা এন্ট্রি
          </h1>
          <p className="text-xs text-slate-500">
            সদস্যদের জমা দেওয়া ট্রানজেকশন অনুমোদন এবং নগদ/ব্যাংক জমার প্রত্যক্ষ এন্ট্রি
          </p>
        </div>

        <button
          onClick={() => setIsDirectEntryOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> সরাসরি চাঁদা এন্ট্রি দিন
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="সদস্যের নাম, মোবাইল বা TrxID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="PENDING">শুধুমাত্র পেন্ডিং (অপেক্ষমান)</option>
            <option value="VERIFIED">শুধুমাত্র যাচাইকৃত</option>
            <option value="REJECTED">বাতিলকৃত</option>
          </select>

          <select
            value={filterFund}
            onChange={(e) => setFilterFund(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="ALL">সকল তহবিল</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">সদস্যের নাম ও ফোন</th>
                <th className="py-3 px-3">তহবিলের নাম</th>
                <th className="py-3 px-3">মাসের নাম</th>
                <th className="py-3 px-3">পরিমাণ</th>
                <th className="py-3 px-3">পদ্ধতি ও TrxID</th>
                <th className="py-3 px-3">বর্তমান স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন ও অনুমোদন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    কোনো চাঁদা বা পেমেন্ট রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{c.user.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{c.user.phone}</p>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{c.fund.title}</td>
                  <td className="py-3 px-3 text-slate-700">{c.monthYear}</td>
                  <td className="py-3 px-3 font-bold text-emerald-800 text-sm">
                    {formatCurrency(c.amountPaid)}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <span className="font-semibold">{c.paymentMethod}</span>
                    {c.transactionId && (
                      <span className="block text-[11px] font-mono text-slate-400">
                        Trx: {c.transactionId}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {c.status === "VERIFIED" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> অনুমোদিত
                      </span>
                    ) : c.status === "PENDING" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-600" /> অপেক্ষমান
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        <XCircle className="w-3 h-3 text-red-600" /> বাতিল
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/receipts/${c.id}`}
                        target="_blank"
                        download
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="রশিদ ডাউনলোড করুন (PDF)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {c.status !== "VERIFIED" && (
                        <button
                          onClick={() => handleVerify(c.id, PaymentStatus.VERIFIED)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition disabled:opacity-50"
                        >
                          ✓ অনুমোদন
                        </button>
                      )}
                      {c.status !== "REJECTED" && (
                        <button
                          onClick={() => handleVerify(c.id, PaymentStatus.REJECTED)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-red-50 text-red-700 rounded-lg transition disabled:opacity-50"
                        >
                          বাতিল
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="p-1 text-slate-400 hover:text-red-700 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Direct Payment Entry */}
      {isDirectEntryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                সরাসরি চাঁদা বা অনুদান এন্ট্রি
              </h3>
              <button onClick={() => setIsDirectEntryOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectEntry} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সদস্য নির্বাচন করুন *
                </label>
                <select
                  value={entryUserId}
                  onChange={(e) => setEntryUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  তহবিল নির্বাচন করুন *
                </label>
                <select
                  value={entryFundId}
                  onChange={(e) => setEntryFundId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মাসের নাম
                  </label>
                  <select
                    value={entryMonth}
                    onChange={(e) => setEntryMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পরিমাণ (৳) *
                  </label>
                  <input
                    type="number"
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(parseFloat(e.target.value) || 0)}
                    required
                    min={50}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={entryMethod}
                    onChange={(e) => setEntryMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value={PaymentMethod.CASH}>ক্যাশ (সরাসরি গ্রহণ)</option>
                    <option value={PaymentMethod.BKASH}>বিকাশ (bKash)</option>
                    <option value={PaymentMethod.NAGAD}>নগদ (Nagad)</option>
                    <option value={PaymentMethod.BANK}>ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ট্রানজেকশন আইডি (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={entryTrxId}
                    onChange={(e) => setEntryTrxId(e.target.value)}
                    placeholder="নগদ হলে খালি রাখুন"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নোট</label>
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  placeholder="উদা: কমিটির মিটিংয়ে নগদ আদায়"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDirectEntryOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "সংরক্ষণ হচ্ছে..." : "এন্ট্রি নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
