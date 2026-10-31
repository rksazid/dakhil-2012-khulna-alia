"use client";

import { useState, useTransition } from "react";
import { formatBengaliDate } from "@/lib/utils";
import { NoticeCategory } from "@prisma/client";
import {
  createNoticeAction,
  updateNoticeAction,
  deleteNoticeAction,
  togglePinNoticeAction,
} from "@/actions/notice-actions";
import { Bell, Plus, Pin, Trash2, Edit2, Calendar } from "lucide-react";

interface NoticeData {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: NoticeCategory;
  isPinned: boolean;
  isPublished: boolean;
  createdAt: Date;
  author?: { name: string } | null;
}

export function NoticesManagerClient({ notices }: { notices: NoticeData[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await createNoticeAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "নতুন নোটিশ প্রকাশিত হয়েছে!" });
        setIsOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNotice) return;
    const formData = new FormData(e.currentTarget);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateNoticeAction(editingNotice.id, formData);
      if (res.success) {
        setFeedback({ type: "success", message: "নোটিশ হালনাগাদ সম্পন্ন।" });
        setEditingNotice(null);
      } else {
        setFeedback({ type: "error", message: res.error || "হালনাগাদ ব্যর্থ।" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("আপনি কি এই নোটিশটি মুছে ফেলতে চান?")) return;
    startTransition(async () => {
      const res = await deleteNoticeAction(id);
      if (res.success) {
        setFeedback({ type: "success", message: "নোটিশ মুছে ফেলা হয়েছে।" });
      } else {
        setFeedback({ type: "error", message: res.error || "মুছতে ব্যর্থ।" });
      }
    });
  };

  const handleTogglePin = (id: string, currentPin: boolean) => {
    startTransition(async () => {
      const res = await togglePinNoticeAction(id, !currentPin);
      if (res.success) {
        setFeedback({ type: "success", message: "পিন স্ট্যাটাস পরিবর্তিত হয়েছে।" });
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900">
            অফিসিয়াল নোটিশ বোর্ড ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-slate-500">
            ওয়েবসাইট ও হোমপেজের রানিং বিজ্ঞপ্তি, জরুরি বার্তা ও সভার নোটিশ তৈরি ও নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> নতুন নোটিশ প্রকাশ করুন
        </button>
      </div>

      {/* Notices List */}
      <div className="grid grid-cols-1 gap-4">
        {notices.map((n) => (
          <div
            key={n.id}
            className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
              n.isPinned ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
            }`}
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                {n.isPinned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Pin className="w-2.5 h-2.5 fill-amber-700" /> পিন করা
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {n.category}
                </span>
                <span className="text-xs text-slate-400">
                  {formatBengaliDate(n.createdAt)}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900">{n.title}</h3>
              <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-3">
                {n.content}
              </p>
            </div>

            <div className="flex sm:flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => handleTogglePin(n.id, n.isPinned)}
                disabled={isPending}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                  n.isPinned ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {n.isPinned ? "আনপিন করুন" : "পিন করুন"}
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingNotice(n)}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg"
                  title="সম্পাদনা"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  disabled={isPending}
                  className="p-1.5 text-slate-400 hover:text-red-700 rounded-lg"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Create Notice */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">নতুন নোটিশ প্রকাশ</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিরোনাম *
                </label>
                <input
                  name="title"
                  required
                  placeholder="উদা: রমজানের পূর্বে মাসিক বকেয়া পর্যালোচনা সভা"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    name="category"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="GENERAL">সাধারণ নোটিশ</option>
                    <option value="URGENT">জরুরি বিজ্ঞপ্তি</option>
                    <option value="MEETING">সভা আহ্বান</option>
                    <option value="FUND">তহবিল সংক্রান্ত</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPinned"
                    name="isPinned"
                    value="true"
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <label htmlFor="isPinned" className="text-xs font-semibold text-slate-700">
                    শীর্ষে পিন করে রাখুন
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিস্তারিত বিবরণ *
                </label>
                <textarea
                  name="content"
                  required
                  rows={5}
                  placeholder="বিজ্ঞপ্তির পূর্ণাঙ্গ বিষয়বস্তু..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "প্রকাশ হচ্ছে..." : "প্রকাশ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Notice */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">নোটিশ সম্পাদনা</h3>
              <button onClick={() => setEditingNotice(null)} className="text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  শিরোনাম *
                </label>
                <input
                  name="title"
                  defaultValue={editingNotice.title}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    name="category"
                    defaultValue={editingNotice.category}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="GENERAL">সাধারণ নোটিশ</option>
                    <option value="URGENT">জরুরি বিজ্ঞপ্তি</option>
                    <option value="MEETING">সভা আহ্বান</option>
                    <option value="FUND">তহবিল সংক্রান্ত</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="edit_isPinned"
                    name="isPinned"
                    value="true"
                    defaultChecked={editingNotice.isPinned}
                    className="w-4 h-4 text-emerald-600 rounded-sm"
                  />
                  <label htmlFor="edit_isPinned" className="text-xs font-semibold text-slate-700">
                    শীর্ষে পিন করে রাখুন
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিস্তারিত বিবরণ *
                </label>
                <textarea
                  name="content"
                  defaultValue={editingNotice.content}
                  required
                  rows={5}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl disabled:opacity-50"
                >
                  {isPending ? "হালনাগাদ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
