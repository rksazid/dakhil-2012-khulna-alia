"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "@/lib/utils";
import { getDefaultRollingMonths } from "@/lib/months";
import { PaymentMethod, PaymentStatus, CommitmentStatus } from "@prisma/client";
import { recordMonthlyContributionAction } from "@/actions/ledger-actions";
import { createOrUpdateCommitmentAction } from "@/actions/fund-actions";
import { updateProfileAction } from "@/actions/auth-actions";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/actions/notification-actions";
import { FileUploader } from "@/components/ui/file-uploader";
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
  GraduationCap,
  Hash,
  School,
  ExternalLink,
  Bell,
  MessageSquare,
  AlertCircle,
  Sparkles,
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
    studentGroup?: string | null;
    classRoll?: string | null;
    classroom?: string | null;
    avatarUrl: string | null;
    bannerUrl?: string | null;
  };
  commitments: CommitmentItem[];
  contributions: ContributionItem[];
  funds: FundItem[];
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    link: string | null;
    type: string;
    isRead: boolean;
    createdAt: string | Date;
  }>;
}

export function MemberDashboardClient({
  user,
  commitments,
  contributions,
  funds,
  notifications = [],
}: MemberDashboardClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"history" | "commitments" | "notifications" | "profile">(
    tabFromUrl === "notifications" ? "notifications" : "history"
  );
  const [userNotifications, setUserNotifications] = useState(notifications);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Instant receipt success dialog after donation
  const [submittedPayment, setSubmittedPayment] = useState<{
    id: string;
    monthYear: string;
    amount: number;
    fundTitle: string;
    status: string;
    paymentMethod: string;
    transactionId?: string | null;
  } | null>(null);

  const unreadNotificationsCount = userNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllNotificationsRead = () => {
    startTransition(async () => {
      setUserNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await markAllNotificationsAsReadAction();
    });
  };

  const handleNotificationItemClick = async (notif: (typeof userNotifications)[0]) => {
    if (!notif.isRead) {
      setUserNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      await markNotificationAsReadAction(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  // Payment form states
  const [payFundId, setPayFundId] = useState(funds[0]?.id || "");
  const [payMonth, setPayMonth] = useState("নভেম্বর-২৬");
  const [payAmount, setPayAmount] = useState<number>(500);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.BKASH);
  const [payTrxId, setPayTrxId] = useState("");
  const [payReceiptUrl, setPayReceiptUrl] = useState("");
  const [payNote, setPayNote] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user.avatarUrl || "");
  const [profileBannerUrl, setProfileBannerUrl] = useState(user.bannerUrl || "");

  // Commitment form states
  const [commitFundId, setCommitFundId] = useState(funds[0]?.id || "");
  const [commitAmount, setCommitAmount] = useState<number>(500);
  const [commitStartMonth, setCommitStartMonth] = useState("অক্টোবর-২৬");

  const monthOptions = getDefaultRollingMonths(18);

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
        receiptUrl: payReceiptUrl || undefined,
        note: payNote,
      });

      if (res.success && res.contribution) {
        const chosenFund = funds.find((f) => f.id === payFundId);
        setSubmittedPayment({
          id: res.contribution.id,
          monthYear: payMonth,
          amount: Number(payAmount),
          fundTitle: chosenFund?.title || "কল্যাণ তহবিল",
          status: "PENDING",
          paymentMethod: payMethod,
          transactionId: payTrxId || null,
        });
        setFeedback({
          type: "success",
          message: "চাঁদা সফলভাবে জমা দেওয়া হয়েছে! আপনার ডিজিটাল রশিদ প্রস্তুত।",
        });
        setIsPaymentModalOpen(false);
        setPayTrxId("");
        setPayReceiptUrl("");
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
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
              activeTab === "notifications"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>নোটিফিকেশন ও আপডেট</span>
            {unreadNotificationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {toBengaliNumber(unreadNotificationsCount)}
              </span>
            )}
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
                    <th className="py-3 px-3">তারিখ</th>
                    <th className="py-3 px-4 text-right">রশিদ / ইনভয়েস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contributions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
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
                      <td className="py-3 px-3 text-slate-400">
                        {formatBengaliDate(c.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/receipts/${c.id}`}
                            target="_blank"
                            download
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                              c.status === "VERIFIED"
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : c.status === "PENDING"
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                            title={
                              c.status === "VERIFIED"
                                ? "অনুমোদিত ডিজিটাল রশিদ ডাউনলোড করুন"
                                : "অপেক্ষমান (পেন্ডিং) রশিদ ডাউনলোড করুন"
                            }
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {c.status === "VERIFIED" ? "রশিদ (অনুমোদিত)" : "রশিদ (পেন্ডিং)"}
                            </span>
                          </a>
                          <a
                            href={`/api/receipts/${c.id}?view=true`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                            title="ব্রাউজারে ভিউ করুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
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

            {/* মাদ্রাসার শিক্ষাবর্ষ তথ্য (ঐচ্ছিক) */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                দাখিল ২০১১-১২ মাদ্রাসার তথ্য (ঐচ্ছিক)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    বিভাগ / গ্রুপ
                  </label>
                  <select
                    name="studentGroup"
                    defaultValue={user.studentGroup || ""}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="SCIENCE">বিজ্ঞান (Science)</option>
                    <option value="ARTS">মানবিক (Arts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    ক্লাস রোল
                  </label>
                  <input
                    name="classRoll"
                    defaultValue={user.classRoll || ""}
                    type="text"
                    placeholder="উদা: ১৫ বা 15"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    শাখা / রুম
                  </label>
                  <input
                    name="classroom"
                    defaultValue={user.classroom || ""}
                    type="text"
                    placeholder="উদা: ক শাখা"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FileUploader
                  folder="avatars"
                  label="প্রোফাইল ছবি"
                  onUploadComplete={setProfileAvatarUrl}
                  initialUrl={profileAvatarUrl}
                />
                <input type="hidden" name="avatarUrl" value={profileAvatarUrl} />
              </div>

              <div>
                <FileUploader
                  folder="banners"
                  label="প্রোফাইল কভার ব্যানার (ঐচ্ছিক)"
                  onUploadComplete={setProfileBannerUrl}
                  initialUrl={profileBannerUrl}
                />
                <input type="hidden" name="bannerUrl" value={profileBannerUrl} />
              </div>
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

      {/* Tab 4: Notifications & Personal Updates */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                ব্যক্তিগত অ্যাক্টিভিটি ও নোটিফিকেশন আপডেট
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার চাঁদা ভেরিফিকেশন, অনুমোদন, ফোরাম রিপ্লাই ও ব্যাচ সংক্রান্ত সকল ব্যক্তিগত বার্তা
              </p>
            </div>

            {userNotifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllNotificationsRead}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> সব পঠিত চিহ্নিত করুন
              </button>
            )}
          </div>

          {userNotifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">কোনো নোটিফিকেশন নেই</p>
              <p className="text-xs text-slate-400">
                আপনার অনুদান অনুমোদিত হলে বা ফোরামে আপনার বার্তায় কেউ উত্তর দিলে এখানে নোটিফিকেশন দেখতে পাবেন।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationItemClick(notif)}
                  className={`py-4 px-3 sm:px-4 rounded-xl flex items-start justify-between gap-3 transition cursor-pointer hover:bg-slate-50 ${
                    !notif.isRead ? "bg-emerald-50/60 border border-emerald-100" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      {notif.type === "PAYMENT_VERIFIED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : notif.type === "PAYMENT_REJECTED" ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : notif.type === "FORUM_REPLY" ? (
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Bell className="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            নতুন
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10.5px] text-slate-400 block font-mono">
                        {formatBengaliDate(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  {notif.link && (
                    <span className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0 flex items-center gap-1">
                      দেখুন <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
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

              <div>
                <FileUploader
                  folder="receipts"
                  label="পেমেন্টের স্ক্রিনশট বা রসিদ (ঐচ্ছিক)"
                  onUploadComplete={setPayReceiptUrl}
                  initialUrl={payReceiptUrl}
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

      {/* Modal: Donation Success & Instant Receipt Download */}
      {submittedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                আলহামদুলিল্লাহ! অনুদান সফল হয়েছে
              </h3>
              <p className="text-xs text-slate-500">
                আপনার চাঁদা সফলভাবে সিস্টেমে যুক্ত হয়েছে। আপনার ডিজিটাল মানি রিসিপ্ট প্রস্তুত।
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">তহবিল:</span>
                <span className="font-bold text-slate-900">{submittedPayment.fundTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">অনুদানের মাস:</span>
                <span className="font-bold text-slate-900">{submittedPayment.monthYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">জমার পরিমাণ:</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {formatCurrency(submittedPayment.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">স্ট্যাটাস:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Clock className="w-2.5 h-2.5 text-amber-600" />
                  যাচাই অপেক্ষমান (Pending)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-left leading-relaxed">
              💡 <strong>রশিদ সংক্রান্ত তথ্য:</strong> বর্তমানে এই রশিদে &quot;যাচাই অপেক্ষমান (Pending)&quot; উল্লেখিত রয়েছে। তহবিল কমিটি ট্রানজেকশনটি যাচাই করলেই রশিদে স্বয়ংক্রিয়ভাবে &quot;অনুমোদিত (Approved)&quot; ও অনুমোদনের তারিখ যুক্ত হয়ে যাবে।
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={`/api/receipts/${submittedPayment.id}`}
                target="_blank"
                download
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <Download className="w-4 h-4" />
                রশিদ ডাউনলোড (PDF)
              </a>
              <a
                href={`/api/receipts/${submittedPayment.id}?view=true`}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                প্রিভিউ
              </a>
            </div>

            <button
              onClick={() => setSubmittedPayment(null)}
              className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
