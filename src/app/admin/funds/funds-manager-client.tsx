"use client";

import { useState, useTransition } from "react";
import { formatCurrency, toBengaliNumber } from "@/lib/utils";
import {
  createFundAction,
  updateFundAction,
  toggleFundStatusAction,
  assignFundManagerAction,
  removeFundManagerAction,
} from "@/actions/fund-actions";
import {
  HeartHandshake,
  Plus,
  Edit2,
  Trash2,
  Users,
  Shield,
  PhoneCall,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { FileUploader } from "@/components/ui/file-uploader";

interface FundData {
  id: string;
  title: string;
  slug: string;
  bannerImageUrl?: string | null;
  description: string | null;
  rules: string | null;
  targetAmount: number | null;
  currentBalance: number;
  contactPerson: string | null;
  contactPhone: string | null;
  bankDetails: string | null;
  isActive: boolean;
  managers: {
    id: string;
    userId: string;
    user: { id: string; name: string; phone: string };
  }[];
  _count: {
    commitments: number;
    contributions: number;
    expenses: number;
  };
}

interface MemberOption {
  id: string;
  name: string;
  phone: string;
  role: string;
}

interface FundsManagerClientProps {
  funds: FundData[];
  allMembers: MemberOption[];
  isSuperAdmin: boolean;
  currentUserId: string;
}

export function FundsManagerClient({
  funds,
  allMembers,
  isSuperAdmin,
  currentUserId,
}: FundsManagerClientProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createBannerUrl, setCreateBannerUrl] = useState("");
  const [editingFund, setEditingFund] = useState<FundData | null>(null);
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [managerAssignFund, setManagerAssignFund] = useState<FundData | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState(allMembers[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCreateFund = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await createFundAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "নতুন তহবিল সফলভাবে তৈরি হয়েছে!" });
        setIsCreateOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "তৈরি করতে ব্যর্থ।" });
      }
    });
  };

  const handleUpdateFund = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFund) return;
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateFundAction(editingFund.id, formData);
      if (res.success) {
        setFeedback({ type: "success", message: "তহবিল তথ্য সফলভাবে হালনাগাদ করা হয়েছে।" });
        setEditingFund(null);
      } else {
        setFeedback({ type: "error", message: res.error || "হালনাগাদ ব্যর্থ।" });
      }
    });
  };

  const handleToggleStatus = (fundId: string, currentStatus: boolean) => {
    if (!confirm(`আপনি কি এই তহবিলটি ${currentStatus ? "স্থগিত" : "সক্রিয়"} করতে চান?`)) return;
    startTransition(async () => {
      const res = await toggleFundStatusAction(fundId, !currentStatus);
      if (res.success) {
        setFeedback({ type: "success", message: "তহবিলের স্ট্যাটাস পরিবর্তিত হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleAssignManager = () => {
    if (!managerAssignFund || !selectedManagerId) return;
    startTransition(async () => {
      const res = await assignFundManagerAction(managerAssignFund.id, selectedManagerId);
      if (res.success) {
        setFeedback({ type: "success", message: "ম্যানেজার নিয়োগ সফল হয়েছে।" });
        setManagerAssignFund(null);
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleRemoveManager = (fundId: string, userId: string) => {
    if (!confirm("আপনি কি এই ম্যানেজারকে তহবিল দায়িত্ব থেকে অব্যাহতি দিতে চান?")) return;
    startTransition(async () => {
      const res = await removeFundManagerAction(fundId, userId);
      if (res.success) {
        setFeedback({ type: "success", message: "ম্যানেজার অব্যাহতি সফল হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
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

      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">তহবিল ব্যবস্থাপনা</h1>
          <p className="text-xs text-slate-500">
            সকল কল্যাণ তহবিলের বিবরণ, ব্যাংক একাউন্ট, শর্তাবলী ও ম্যানেজারদের দায়িত্ব বণ্টন
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> নতুন তহবিল তৈরি করুন
          </button>
        )}
      </div>

      {/* Funds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {funds.map((fund) => {
          const isUserAssigned =
            isSuperAdmin || fund.managers.some((m) => m.userId === currentUserId);

          return (
            <div
              key={fund.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        fund.isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {fund.isActive ? "সক্রিয়" : "স্থগিত"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">#{fund.slug}</span>
                  </div>

                  <Link
                    href={`/funds/${fund.slug}`}
                    target="_blank"
                    className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-0.5"
                  >
                    পাবলিক ভিউ <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{fund.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {fund.description || "কোনো বিবরণ দেওয়া হয়নি।"}
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">বর্তমান স্থিতি:</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {formatCurrency(fund.currentBalance)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">টার্গেট লক্ষ্যমাত্রা:</span>
                    <span className="font-bold text-slate-800">
                      {fund.targetAmount ? formatCurrency(fund.targetAmount) : "অনির্দিষ্ট"}
                    </span>
                  </div>
                </div>

                {/* Managers List */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-700" /> তহবিল ম্যানেজারবৃন্দ:
                    </span>
                    {isSuperAdmin && (
                      <button
                        onClick={() => setManagerAssignFund(fund)}
                        className="text-[10px] font-semibold text-emerald-700 hover:underline"
                      >
                        + ম্যানেজার নিয়োগ
                      </button>
                    )}
                  </div>

                  {fund.managers.length === 0 ? (
                    <p className="text-[11px] text-slate-400">কোনো ম্যানেজার নিযুক্ত নেই।</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {fund.managers.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]"
                        >
                          {m.user.name}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRemoveManager(fund.id, m.userId)}
                              className="text-red-500 hover:text-red-700 ml-1"
                              title="অব্যাহতি দিন"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUserAssigned && (
                    <button
                      onClick={() => setEditingFund(fund)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> সম্পাদনা
                    </button>
                  )}
                  <Link
                    href={`/admin/ledger?fundId=${fund.id}`}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition"
                  >
                    লেজার দেখুন
                  </Link>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => handleToggleStatus(fund.id, fund.isActive)}
                    className={`text-xs font-medium ${
                      fund.isActive ? "text-amber-700 hover:underline" : "text-emerald-700 hover:underline"
                    }`}
                  >
                    {fund.isActive ? "স্থগিত করুন" : "সক্রিয় করুন"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Fund */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-between justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">নতুন তহবিল তৈরি করুন</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFund} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  তহবিলের নাম *
                </label>
                <input
                  name="title"
                  required
                  placeholder="উদা: সদকায়ে যারিয়াহ ও বন্ধু কল্যাণ ফান্ড"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  স্লাগ (URL Slug)
                </label>
                <input
                  name="slug"
                  placeholder="sadqah-welfare-fund (খালি রাখলে স্বয়ংক্রিয় তৈরি হবে)"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংক্ষিপ্ত উদ্দেশ্য ও বিবরণ
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="তহবিলের মূল লক্ষ্য ও কার্যক্রম..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <FileUploader
                  folder="banners"
                  label="তহবিলের ব্যানার ছবি (Vercel Object Store)"
                  onUploadComplete={setCreateBannerUrl}
                  initialUrl={createBannerUrl}
                />
                <input type="hidden" name="bannerImageUrl" value={createBannerUrl} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    শর্ত ও নিয়মাবলী (নীতিমালা)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Markdown সমর্থিত: **বোল্ড**, - তালিকা, ### শিরোনাম
                  </span>
                </div>
                <textarea
                  name="rules"
                  rows={4}
                  placeholder="### ১. তহবিলের মূল উদ্দেশ্য&#10;- প্রতি মাসের ১-১০ তারিখের মধ্যে জমা দিতে হবে&#10;- অসুস্থ বন্ধুদের চিকিৎসা সহায়তায় ব্যয় হবে..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    টার্গেট বা লক্ষ্যমাত্রা (৳)
                  </label>
                  <input
                    name="targetAmount"
                    type="number"
                    placeholder="উদা: 500000"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    যোগাযোগ নম্বর
                  </label>
                  <input
                    name="contactPhone"
                    placeholder="01711000002"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যাংক ও মোবাইল ব্যাংকিং বিবরণ
                </label>
                <textarea
                  name="bankDetails"
                  rows={3}
                  placeholder="বিকাশ (পার্সোনাল): 01711...&#10;নগদ: 01711...&#10;ব্যাংক একাউন্ট নম্বর..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "তৈরি হচ্ছে..." : "তহবিল তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Fund */}
      {editingFund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">তহবিল সম্পাদনা</h3>
              <button onClick={() => setEditingFund(null)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateFund} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  তহবিলের নাম *
                </label>
                <input
                  name="title"
                  defaultValue={editingFund.title}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংক্ষিপ্ত উদ্দেশ্য ও বিবরণ
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingFund.description || ""}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <FileUploader
                  folder="banners"
                  label="তহবিলের ব্যানার ছবি (Vercel Object Store)"
                  onUploadComplete={setEditBannerUrl}
                  initialUrl={editingFund.bannerImageUrl || editBannerUrl}
                />
                <input type="hidden" name="bannerImageUrl" value={editBannerUrl || editingFund.bannerImageUrl || ""} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    শর্ত ও নিয়মাবলী (নীতিমালা)
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Markdown সমর্থিত: **বোল্ড**, - তালিকা, ### শিরোনাম
                  </span>
                </div>
                <textarea
                  name="rules"
                  rows={4}
                  defaultValue={editingFund.rules || ""}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    টার্গেট বা লক্ষ্যমাত্রা (৳)
                  </label>
                  <input
                    name="targetAmount"
                    type="number"
                    defaultValue={editingFund.targetAmount || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    যোগাযোগ নম্বর
                  </label>
                  <input
                    name="contactPhone"
                    defaultValue={editingFund.contactPhone || ""}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ব্যাংক ও মোবাইল ব্যাংকিং বিবরণ
                </label>
                <textarea
                  name="bankDetails"
                  rows={3}
                  defaultValue={editingFund.bankDetails || ""}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFund(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "সংরক্ষণ হচ্ছে..." : "হালনাগাদ সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Manager */}
      {managerAssignFund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                ফান্ড ম্যানেজার দায়িত্ব অর্পণ
              </h3>
              <button onClick={() => setManagerAssignFund(null)} className="text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4">
              <p className="text-xs text-slate-600">
                <strong className="text-slate-900">{managerAssignFund.title}</strong> তহবিলের জন্য নিচের সদস্যকে ম্যানেজার হিসেবে নিযুক্ত করুন:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সদস্য নির্বাচন করুন
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone}) - {m.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagerAssignFund(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleAssignManager}
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "নিযুক্ত হচ্ছে..." : "দায়িত্ব অর্পণ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
