"use client";

import { useState, useTransition } from "react";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import { PaymentMethod, PaymentStatus, CommitmentStatus } from "@prisma/client";
import { recordMonthlyContributionAction } from "@/actions/ledger-actions";
import { createOrUpdateCommitmentAction } from "@/actions/fund-actions";
import { updateProfileAction } from "@/actions/auth-actions";
import {
  CreditCard,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  Download,
  Printer,
  Edit2,
  Save,
  User,
  HeartHandshake,
  Check,
} from "lucide-react";

interface FundItem {
  id: string;
  title: string;
  slug: string;
  bankDetails: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
}

interface CommitmentItem {
  id: string;
  fundId: string;
  committedAmount: number;
  startMonth: string;
  status: CommitmentStatus;
  fund: { id: string; title: string; slug: string; bankDetails: string | null };
}

interface ContributionItem {
  id: string;
  fundId: string;
  monthYear: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  receiptUrl: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: Date;
  fund: { title: string; slug: string };
  verifiedBy?: { name: string } | null;
}

interface MemberDashboardClientProps {
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    bio: string | null;
    bloodGroup: string | null;
    occupation: string | null;
    workplace: string | null;
    presentAddress: string | null;
    permanentAddress: string | null;
    showPhoneInDirectory: boolean;
    showEmailInDirectory: boolean;
    avatarUrl: string | null;
  };
  commitments: CommitmentItem[];
  contributions: ContributionItem[];
  funds: FundItem[];
}

export function MemberDashboardClient({
  user,
  commitments,
  contributions,
  funds,
}: MemberDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"history" | "commitments" | "profile">("history");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Payment form states
  const [payFundId, setPayFundId] = useState(funds[0]?.id || "");
  const [payMonth, setPayMonth] = useState("নভেম্বর-২৬");
  const [payAmount, setPayAmount] = useState<number>(500);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.BKASH);
  const [payTrxId, setPayTrxId] = useState("");
  const [payNote, setPayNote] = useState("");

  // Commitment form states
  const [commitFundId, setCommitFundId] = useState(funds[0]?.id || "");
  const [commitAmount, setCommitAmount] = useState<number>(500);
  const [commitStartMonth, setCommitStartMonth] = useState("অক্টোবর-২৬");

  const monthOptions = [
    "অক্টোবর-২৬",
    "নভেম্বর-২৬",
    "ডিসেম্বর-২৬",
    "জানুয়ারি-২৭",
    "ফেব্রুয়ারি-২৭",
    "মার্চ-২৭",
  ];

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await recordMonthlyContributionAction({
        fundId: payFundId,
        userId: user.id,
        monthYear: payMonth,
        amountPaid: Number(payAmount),
        paymentMethod: payMethod,
        transactionId: payTrxId,
        note: payNote,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: "চাঁদা সফলভাবে জমা দেওয়া হয়েছে! ভেরিফিকেশনের জন্য অপেক্ষায় রাখা হয়েছে।",
        });
        setIsPaymentModalOpen(false);
        setPayTrxId("");
        setPayNote("");
      } else {
        setFeedback({ type: "error", message: res.error || "চাঁদা এন্ট্রি ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleCommitmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createOrUpdateCommitmentAction(
        commitFundId,
        Number(commitAmount),
        commitStartMonth,
        CommitmentStatus.ACTIVE
      );
      if (res.success) {
        setFeedback({ type: "success", message: "মাসিক প্রতিশ্রুতি সফলভাবে সংরক্ষিত হয়েছে।" });
        setIsCommitModalOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "সংরক্ষণ ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "প্রোফাইল সফলভাবে হালনাগাদ করা হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "হালনাগাদ ব্যর্থ হয়েছে।" });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-red-50 text-red-900 border-red-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === "history"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            চাঁদা প্রদানের ইতিহাস ({toBengaliNumber(contributions.length)})
          </button>
          <button
            onClick={() => setActiveTab("commitments")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === "commitments"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            আমার প্রতিশ্রুতি ({toBengaliNumber(commitments.length)})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
              activeTab === "profile"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            প্রোফাইল সেটিংস
          </button>
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          মাসিক চাঁদা জমা দিন
        </button>
      </div>

      {/* Tab 1: Payment History Ledger */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800">
              ব্যক্তিগত ট্রানজেকশন ও ভাউচার লেজার
            </h3>
            <span className="text-xs text-slate-500">
              সর্বশেষ {toBengaliNumber(contributions.length)}টি লেনদেন
            </span>
          </div>

          {contributions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm font-medium text-slate-600">
                আপনি এখনো কোনো চাঁদা জমা দেননি।
              </p>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl"
              >
                প্রথম চাঁদা জমা দিন
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">তহবিল</th>
                    <th className="py-3 px-3">মাসের নাম</th>
                    <th className="py-3 px-3">টাকার পরিমাণ</th>
                    <th className="py-3 px-3">পদ্ধতি ও TrxID</th>
                    <th className="py-3 px-3">স্ট্যাটাস</th>
                    <th className="py-3 px-4 text-right">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contributions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.fund.title}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {c.monthYear}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-800">
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
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            যাচাইকৃত প্রাপ্তি
                          </span>
                        ) : c.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            যাচাই অপেক্ষমান
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            বাতিল
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {formatBengaliDate(c.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Commitments */}
      {activeTab === "commitments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              আমার মাসিক প্রতিশ্রুতির তালিকা
            </h3>
            <button
              onClick={() => setIsCommitModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
            >
              + নতুন ফান্ডে অঙ্গীকার করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commitments.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    শুরু: {c.startMonth}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {c.fund.title}
                  </h4>
                  <p className="text-sm font-black text-emerald-800 mt-2">
                    মাসিক প্রতিশ্রুতি: {formatCurrency(c.committedAmount)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    সক্রিয়
                  </span>
                  <button
                    onClick={() => {
                      setCommitFundId(c.fundId);
                      setCommitAmount(c.committedAmount);
                      setCommitStartMonth(c.startMonth);
                      setIsCommitModalOpen(true);
                    }}
                    className="block text-xs text-slate-500 hover:text-emerald-700 mt-2"
                  >
                    সম্পাদনা করুন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Profile Settings */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">প্রোফাইল ও ডিরেক্টরি তথ্য হালনাগাদ</h3>
            <p className="text-xs text-slate-500">
              আপনার সঠিক পেশা, রক্তের গ্রুপ ও ঠিকানা বন্ধুদের কাছে পৌঁছাতে সহায়তা করবে।
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নাম</label>
                <input
                  name="name"
                  defaultValue={user.name}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর (স্থির)
                </label>
                <input
                  value={user.phone}
                  disabled
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 bg-slate-50 text-slate-500 rounded-xl font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ইমেইল ঠিকানা (ডিরেক্টরিতে প্রদর্শিত হবে)
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email || ""}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  রক্তের গ্রুপ
                </label>
                <select
                  name="bloodGroup"
                  defaultValue={user.bloodGroup || ""}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পেশা / পদবি
                </label>
                <input
                  name="occupation"
                  defaultValue={user.occupation || ""}
                  placeholder="উদা: সফটওয়্যার ইঞ্জিনিয়ার, ব্যাংকার, ব্যবসায়ী"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতিষ্ঠান / কর্মস্থল
                </label>
                <input
                  name="workplace"
                  defaultValue={user.workplace || ""}
                  placeholder="উদা: ইসলামী ব্যাংক, গ্রামীণফোন"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বর্তমান ঠিকানা / জেলা
                </label>
                <input
                  name="presentAddress"
                  defaultValue={user.presentAddress || ""}
                  placeholder="উদা: বয়রা, খুলনা অথবা মিরপুর, ঢাকা"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্থায়ী ঠিকানা
                </label>
                <input
                  name="permanentAddress"
                  defaultValue={user.permanentAddress || ""}
                  placeholder="উদা: রূপসা, খুলনা"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সংক্ষিপ্ত বায়ো
              </label>
              <textarea
                name="bio"
                rows={2}
                defaultValue={user.bio || ""}
                placeholder="নিজের স্মৃতি বা বর্তমান ব্যস্ততা সম্পর্কে লিখুন..."
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isPending ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল পরিবর্তন সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 1: Submit Monthly Contribution */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  মাসিক চাঁদা বা অনুদান এন্ট্রি
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  তহবিল নির্বাচন করুন *
                </label>
                <select
                  value={payFundId}
                  onChange={(e) => setPayFundId(e.target.value)}
                  required
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
                    মাসের নাম *
                  </label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
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
                    টাকার পরিমাণ (৳) *
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    required
                    min={50}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট চ্যানেল *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value={PaymentMethod.BKASH}>বিকাশ (bKash)</option>
                    <option value={PaymentMethod.NAGAD}>নগদ (Nagad)</option>
                    <option value={PaymentMethod.ROCKET}>রকেট (Rocket)</option>
                    <option value={PaymentMethod.BANK}>ব্যাংক ট্রান্সফার</option>
                    <option value={PaymentMethod.CASH}>ক্যাশ (সরাসরি জমাদান)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ট্রানজেকশন আইডি (TrxID)
                  </label>
                  <input
                    type="text"
                    value={payTrxId}
                    onChange={(e) => setPayTrxId(e.target.value)}
                    placeholder="উদা: 9A8B7C6D"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নোট বা মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="উদা: অক্টোবর ও নভেম্বর মাসের একসাথে প্রদান"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed">
                💡 <span className="font-semibold">পেমেন্ট করার পর:</span> ট্রানজেকশন আইডি দিয়ে সাবমিট করার সাথে সাথে ফান্ড ম্যানেজার এটি অডিট করে ভেরিফাই করবেন।
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "জমা হচ্ছে..." : "সাবমিট করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Commit / Pledge to a Fund */}
      {isCommitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  মাসিক অঙ্গীকার নির্ধারণ করুন
                </h3>
              </div>
              <button
                onClick={() => setIsCommitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCommitmentSubmit} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  তহবিল নির্বাচন করুন
                </label>
                <select
                  value={commitFundId}
                  onChange={(e) => setCommitFundId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রতি মাসে কি পরিমাণ চাঁদা দেবেন? (৳)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[200, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCommitAmount(amt)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        commitAmount === amt
                          ? "bg-emerald-700 text-white border-emerald-800"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(parseFloat(e.target.value) || 0)}
                  min={100}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কোন মাস থেকে শুরু হবে?
                </label>
                <select
                  value={commitStartMonth}
                  onChange={(e) => setCommitStartMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCommitModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "সংরক্ষণ হচ্ছে..." : "অঙ্গীকার নিশ্চিত করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
