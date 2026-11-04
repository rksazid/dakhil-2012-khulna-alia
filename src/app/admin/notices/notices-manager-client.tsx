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
import { Bell, Plus, Pin, Trash2, Edit2, Calendar, Eye, Edit3 } from "lucide-react";
import { MarkdownContent } from "@/components/ui/markdown-content";

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

  // Markdown content & tabs
  const [createContent, setCreateContent] = useState("");
  const [createTab, setCreateTab] = useState<"write" | "preview">("write");

  const [editContent, setEditContent] = useState("");
  const [editTab, setEditTab] = useState<"write" | "preview">("write");

  const handleOpenCreate = () => {
    setCreateContent("");
    setCreateTab("write");
    setIsOpen(true);
  };

  const handleOpenEdit = (n: NoticeData) => {
    setEditingNotice(n);
    setEditContent(n.content);
    setEditTab("write");
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createContent.trim()) {
      setFeedback({ type: "error", message: "অনুগ্রহ করে নোটিশের বিস্তারিত বিবরণ লিখুন।" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("content", createContent);
    setFeedback(null);
    startTransition(async () => {
      const res = await createNoticeAction(formData);
      if (res.success) {
        setFeedback({ type: "success", message: "নতুন নোটিশ প্রকাশিত হয়েছে!" });
        setIsOpen(false);
        setCreateContent("");
      } else {
        setFeedback({ type: "error", message: res.error || "ব্যর্থ হয়েছে।" });
      }
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNotice) return;
    if (!editContent.trim()) {
      setFeedback({ type: "error", message: "অনুগ্রহ করে নোটিশের বিস্তারিত বিবরণ লিখুন।" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    formData.set("content", editContent);
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
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> নতুন নোটিশ প্রকাশ করুন
        </button>
      </div>

      {/* Notices List */}
      {notices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">বর্তমানে কোনো নোটিশ প্রকাশিত হয়নি।</p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> নতুন নোটিশ প্রকাশ করুন
          </button>
        </div>
      ) : (
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
              <div className="text-xs text-slate-600 line-clamp-3">
                <MarkdownContent content={n.content} />
              </div>
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
                  onClick={() => handleOpenEdit(n)}
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
      )}

      {/* Modal: Create Notice */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">নতুন নোটিশ প্রকাশ</h3>
                <p className="text-[11px] text-slate-500">নোটিশের বিবরণ রিচ টেক্সট / Markdown ফরম্যাটে লেখা যাবে</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCreateContent("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
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

              {/* Markdown Content Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    বিস্তারিত বিবরণ (Markdown সমর্থিত) *
                  </label>

                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setCreateTab("write")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                        createTab === "write"
                          ? "bg-white text-emerald-800 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>সম্পাদনা (Write)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateTab("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                        createTab === "preview"
                          ? "bg-white text-emerald-800 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>প্রিভিউ (Preview)</span>
                    </button>
                  </div>
                </div>

                {/* Quick Markdown Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">💡 ফরম্যাট:</span>
                  <button
                    type="button"
                    onClick={() => setCreateContent((prev) => prev ? prev + " **বোল্ড টেক্সট**" : "**বোল্ড টেক্সট**")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="বোল্ড"
                  >
                    **বোল্ড**
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateContent((prev) => prev ? prev + " *ইটালিক*" : "*ইটালিক*")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="ইটালিক"
                  >
                    *ইটালিক*
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateContent((prev) => prev ? prev + "\n### অনুচ্ছেদের শিরোনাম" : "### অনুচ্ছেদের শিরোনাম")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="হেডিং"
                  >
                    ### হেডিং
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateContent((prev) => prev ? prev + "\n- প্রথম বিষয়\n- দ্বিতীয় বিষয়" : "- প্রথম বিষয়\n- দ্বিতীয় বিষয়")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="তালিকা"
                  >
                    - তালিকা
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateContent((prev) => prev ? prev + "\n> গুরুত্বপূর্ণ বার্তা" : "> গুরুত্বপূর্ণ বার্তা")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="উদ্ধৃতি"
                  >
                    &gt; উক্তি
                  </button>
                </div>

                {createTab === "write" ? (
                  <textarea
                    rows={6}
                    value={createContent}
                    onChange={(e) => setCreateContent(e.target.value)}
                    placeholder="বিজ্ঞপ্তির পূর্ণাঙ্গ বিষয়বস্তু (Markdown ফরম্যাট সমর্থিত)...&#10;&#10;### সভার আলোচ্যসূচি&#10;- ফান্ড রিপোর্ট পেশ&#10;- রমজান প্রস্তুতি&#10;&#10;**অনুরোধক্রমে:** আহ্বায়ক কমিটি"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[160px] max-h-[260px] overflow-y-auto">
                    {createContent.trim() ? (
                      <MarkdownContent content={createContent} className="text-xs sm:text-sm" />
                    ) : (
                      <p className="text-slate-400 italic text-xs">কোনো বিষয়বস্তু লেখা হয়নি। প্রিভিউ দেখার জন্য প্রথমে &apos;সম্পাদনা&apos; ট্যাবে লিখুন।</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setCreateContent("");
                  }}
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
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">নোটিশ সম্পাদনা</h3>
                <p className="text-[11px] text-slate-500">নোটিশের বিষয়বস্তু সংশোধন বা নতুন ফরম্যাট প্রয়োগ করুন</p>
              </div>
              <button
                onClick={() => setEditingNotice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
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

              {/* Markdown Content Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    বিস্তারিত বিবরণ (Markdown সমর্থিত) *
                  </label>

                  <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditTab("write")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                        editTab === "write"
                          ? "bg-white text-emerald-800 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>সম্পাদনা (Write)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTab("preview")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                        editTab === "preview"
                          ? "bg-white text-emerald-800 shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>প্রিভিউ (Preview)</span>
                    </button>
                  </div>
                </div>

                {/* Quick Markdown Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-700">💡 ফরম্যাট:</span>
                  <button
                    type="button"
                    onClick={() => setEditContent((prev) => prev ? prev + " **বোল্ড টেক্সট**" : "**বোল্ড টেক্সট**")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="বোল্ড"
                  >
                    **বোল্ড**
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent((prev) => prev ? prev + " *ইটালিক*" : "*ইটালিক*")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="ইটালিক"
                  >
                    *ইটালিক*
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent((prev) => prev ? prev + "\n### নতুন অনুচ্ছেদ" : "### নতুন অনুচ্ছেদ")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="হেডিং"
                  >
                    ### হেডিং
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent((prev) => prev ? prev + "\n- নতুন পয়েন্ট" : "- নতুন পয়েন্ট")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="তালিকা"
                  >
                    - তালিকা
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditContent((prev) => prev ? prev + "\n> উদ্ধৃতি বার্তা" : "> উদ্ধৃতি বার্তা")}
                    className="font-mono bg-white hover:bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 transition text-slate-700"
                    title="উদ্ধৃতি"
                  >
                    &gt; উক্তি
                  </button>
                </div>

                {editTab === "write" ? (
                  <textarea
                    rows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl font-mono leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[160px] max-h-[260px] overflow-y-auto">
                    {editContent.trim() ? (
                      <MarkdownContent content={editContent} className="text-xs sm:text-sm" />
                    ) : (
                      <p className="text-slate-400 italic text-xs">কোনো বিষয়বস্তু নেই।</p>
                    )}
                  </div>
                )}
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
