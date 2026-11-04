"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CommitmentStatus, PaymentMethod } from "@prisma/client";
import { createOrUpdateCommitmentAction, deleteCommitmentAction } from "@/actions/fund-actions";
import { recordMonthlyContributionAction } from "@/actions/ledger-actions";
import { formatCurrency, toBengaliNumber } from "@/lib/utils";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  HeartHandshake,
  CheckCircle2,
  Edit2,
  Trash2,
  CreditCard,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Receipt,
  Download,
  X,
  ExternalLink,
  Shield,
  Sparkles,
} from "lucide-react";

export interface SerializedCommitment {
  id: string;
  fundId: string;
  committedAmount: number;
  startMonth: string;
  status: CommitmentStatus;
}

interface FundCommitmentCardProps {
  fundId: string;
  fundTitle: string;
  fundSlug: string;
  isLoggedIn: boolean;
  initialCommitment?: SerializedCommitment | null;
  monthOptions: string[];
  bankDetails?: string | null;
}

const PRESET_AMOUNTS = [300, 500, 1000, 2000];

export function FundCommitmentCard({
  fundId,
  fundTitle,
  fundSlug,
  isLoggedIn,
  initialCommitment = null,
  monthOptions,
  bankDetails,
}: FundCommitmentCardProps) {
  const [commitment, setCommitment] = useState<SerializedCommitment | null>(initialCommitment);
  const [isEditing, setIsEditing] = useState<boolean>(!initialCommitment);
  const [selectedAmount, setSelectedAmount] = useState<number>(
    initialCommitment?.committedAmount || 500
  );
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(
    initialCommitment ? !PRESET_AMOUNTS.includes(initialCommitment.committedAmount) : false
  );
  const [customAmountVal, setCustomAmountVal] = useState<string>(
    initialCommitment ? String(initialCommitment.committedAmount) : ""
  );
  const [startMonth, setStartMonth] = useState<string>(
    initialCommitment?.startMonth || monthOptions[0] || "নভেম্বর-২৬"
  );
  const [status, setStatus] = useState<CommitmentStatus>(
    initialCommitment?.status || CommitmentStatus.ACTIVE
  );

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Payment modal state for quick contribution submission right from fund page
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMonth, setPayMonth] = useState<string>(monthOptions[0] || "নভেম্বর-২৬");
  const [payAmount, setPayAmount] = useState<number>(commitment?.committedAmount || 500);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.BKASH);
  const [payTrxId, setPayTrxId] = useState("");
  const [payReceiptUrl, setPayReceiptUrl] = useState("");
  const [payNote, setPayNote] = useState("");
  const [submittedPayment, setSubmittedPayment] = useState<{
    id: string;
    receiptNo?: string;
  } | null>(null);

  // Handle saving (creating or editing) commitment
  const handleSaveCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const finalAmount = isCustomAmount ? Number(customAmountVal) : selectedAmount;
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 50) {
      setFeedback({
        type: "error",
        message: "অনুগ্রহ করে কমপক্ষে ৫০ টাকা বা তার বেশি অঙ্ক নির্ধারণ করুন।",
      });
      return;
    }

    startTransition(async () => {
      const res = await createOrUpdateCommitmentAction(
        fundId,
        finalAmount,
        startMonth,
        status
      );

      if (res.success && res.commitment) {
        setCommitment(res.commitment);
        setIsEditing(false);
        setFeedback({
          type: "success",
          message: commitment
            ? "আপনার মাসিক প্রতিশ্রুতি সফলভাবে হালনাগাদ করা হয়েছে!"
            : "আলহামদুলিল্লাহ! এই তহবিলে আপনার মাসিক প্রতিশ্রুতি নিশ্চিত করা হয়েছে।",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "প্রতিশ্রুতি সংরক্ষণ করতে সমস্যা হয়েছে।",
        });
      }
    });
  };

  // Handle deleting commitment
  const handleDeleteCommitment = () => {
    if (!confirm("আপনি কি নিশ্চিত যে এই তহবিলের মাসিক প্রতিশ্রুতি বাতিল করতে চান?")) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteCommitmentAction(fundId);
      if (res.success) {
        setCommitment(null);
        setIsEditing(true);
        setSelectedAmount(500);
        setIsCustomAmount(false);
        setFeedback({
          type: "success",
          message: "এই তহবিলের মাসিক প্রতিশ্রুতি বাতিল করা হয়েছে।",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "প্রতিশ্রুতি বাতিল করতে সমস্যা হয়েছে।",
        });
      }
    });
  };

  // Handle quick contribution submission
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!payAmount || payAmount <= 0) {
      alert("অনুগ্রহ করে জমার সঠিক পরিমাণ লিখুন।");
      return;
    }

    startTransition(async () => {
      const res = await recordMonthlyContributionAction({
        fundId,
        monthYear: payMonth,
        amountPaid: Number(payAmount),
        paymentMethod: payMethod,
        transactionId: payTrxId.trim() || undefined,
        receiptUrl: payReceiptUrl.trim() || undefined,
        note: payNote.trim() || undefined,
      });

      if (res.success && res.contribution) {
        setSubmittedPayment({
          id: res.contribution.id,
        });
        setIsPayModalOpen(false);
        setPayTrxId("");
        setPayReceiptUrl("");
        setPayNote("");
      } else {
        alert(res.error || "চাঁদা এন্ট্রি জমা দিতে সমস্যা হয়েছে।");
      }
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 border border-emerald-800 shadow-md space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              মাসিক অংশীদারিত্ব ও প্রতিশ্রুতি
            </h3>
            <p className="text-[11px] text-emerald-200">
              নিয়মিত মাসিক চাঁদা দিয়ে কল্যাণ কার্যক্রমে শরিক হোন
            </p>
          </div>
        </div>

        <p className="text-xs text-emerald-100 leading-relaxed">
          এই তহবিলে নিয়মিত মাসিক অনুদান বা অঙ্গীকারের হিসাব পরিচালনা করতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।
        </p>

        <Link
          href={`/login?callbackUrl=/funds/${fundSlug}`}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-md"
        >
          <Lock className="w-4 h-4" />
          লগইন করে প্রতিশ্রুতি দিন
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-xs border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold leading-relaxed">{feedback.message}</span>
        </div>
      )}

      {/* Instant Receipt Celebration Dialog (after payment) */}
      {submittedPayment && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>আলহামদুলিল্লাহ! চাঁদা এন্ট্রি সফল হয়েছে</span>
            </div>
            <button
              onClick={() => setSubmittedPayment(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            আপনার প্রদানকৃত চাঁদা তথ্য ডাটাবেসে জমা হয়েছে। কর্তৃপক্ষ যাচাইপূর্বক অনুমোদন দিলে আপনার কেন্দ্রীয় লেজারে গৃহীত হবে।
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={`/api/receipts/${submittedPayment.id}?view=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              ডিজিটাল মানি রিসিপ্ট দেখুন
            </a>
            <a
              href={`/verify/receipt/${submittedPayment.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              ভেরিফিকেশন পেজ
            </a>
          </div>
        </div>
      )}

      {/* Main Commitment Container */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        {/* CASE 1: Existing Active Commitment View (Collapsed summary with Edit button) */}
        {commitment && !isEditing ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Check className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 block">
                    আপনার প্রতিশ্রুতি সক্রিয়
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    {fundTitle}
                  </h3>
                </div>
              </div>

              <span
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                  commitment.status === CommitmentStatus.ACTIVE
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {commitment.status === CommitmentStatus.ACTIVE ? "সক্রিয়" : "স্থগিত"}
              </span>
            </div>

            {/* Metric pill */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 p-4 rounded-2xl border border-emerald-100/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  প্রতিশ্রুত মাসিক অনুদান
                </span>
                <span className="text-2xl font-black text-emerald-800 tracking-tight">
                  {formatCurrency(commitment.committedAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">প্রতি মাসে নিয়মিত প্রদেয়</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">
                  শুরুর নির্ধারিত মাস
                </span>
                <span className="text-sm font-bold text-slate-800 block">
                  {commitment.startMonth}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedAmount(commitment.committedAmount);
                  setStartMonth(commitment.startMonth);
                  setStatus(commitment.status);
                  setIsCustomAmount(!PRESET_AMOUNTS.includes(commitment.committedAmount));
                  setCustomAmountVal(String(commitment.committedAmount));
                  setIsEditing(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-700" />
                প্রতিশ্রুতি এডিট / পরিবর্তন
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayAmount(commitment.committedAmount);
                  setIsPayModalOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <CreditCard className="w-3.5 h-3.5" />
                চাঁদা প্রদান করেছি (এন্ট্রি দিন)
              </button>
            </div>
          </div>
        ) : (
          /* CASE 2: Add or Edit Commitment Form right here */
          <form onSubmit={handleSaveCommitment} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    {commitment ? "মাসিক প্রতিশ্রুতি পরিবর্তন করুন" : "মাসিক প্রতিশ্রুতি / অঙ্গীকার যুক্ত করুন"}
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    তহবিল: {fundTitle}
                  </p>
                </div>
              </div>

              {commitment && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                মাসিক অনুদানের পরিমাণ (টাকা)
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = !isCustomAmount && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setIsCustomAmount(false);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        isSelected
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ৳ {toBengaliNumber(amt)}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomAmount(!isCustomAmount)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                    isCustomAmount
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  অন্যান্য অঙ্ক লিখুন
                </button>
                {isCustomAmount && (
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs font-bold">
                      ৳
                    </span>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      required
                      placeholder="পরিমাণ (যেমন: ৭০০)"
                      value={customAmountVal}
                      onChange={(e) => setCustomAmountVal(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs font-bold border border-emerald-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Starting Month Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শুরুর নির্ধারিত মাস
                </label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {commitment && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্ট্যাটাস
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CommitmentStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={CommitmentStatus.ACTIVE}>সক্রিয় (Active)</option>
                    <option value={CommitmentStatus.PAUSED}>স্থগিত (Paused)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {commitment ? "পরিবর্তন সংরক্ষণ করুন" : "প্রতিশ্রুতি নিশ্চিত করুন"}
                  </>
                )}
              </button>

              {commitment && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    বাতিল
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteCommitment}
                    disabled={isPending}
                    title="প্রতিশ্রুতি সম্পূর্ণ বাতিল করুন"
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Quick Payment Submission Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    চাঁদা প্রদান তথ্য এন্ট্রি
                  </h3>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    {fundTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bank details summary reminder */}
            {bankDetails && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 whitespace-pre-line font-mono">
                {bankDetails}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অনুদানের মাস *
                  </label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
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
                    জমার পরিমাণ (টাকা) *
                  </label>
                  <input
                    type="number"
                    min={50}
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম *
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold"
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
                    placeholder="উদা: BK1289XYZ"
                    value={payTrxId}
                    onChange={(e) => setPayTrxId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <FileUploader
                  folder="receipts"
                  label="টাকা পাঠানোর স্ক্রিনশট বা রসিদ (ঐচ্ছিক)"
                  onUploadComplete={setPayReceiptUrl}
                  initialUrl={payReceiptUrl}
                  accept="image/*,application/pdf"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  অতিরিক্ত মন্তব্য (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="কোনো বিশেষ তথ্য থাকলে লিখতে পারেন..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      জমা হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      চাঁদা এন্ট্রি জমা দিন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
