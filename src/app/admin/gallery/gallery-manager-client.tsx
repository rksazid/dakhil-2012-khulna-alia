"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  ExternalLink,
  FolderHeart,
  X,
  Tag,
  Loader2,
} from "lucide-react";
import { FileUploader } from "@/components/ui/file-uploader";
import {
  createGalleryItemAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
} from "@/actions/gallery-actions";

export interface GalleryItemData {
  id: string;
  title: string;
  imageUrl: string;
  caption?: string | null;
  eventDate?: string | null;
  category?: string | null;
  createdAt: Date | string;
}

const CATEGORY_PRESETS = [
  "ক্যাম্পাস জীবন",
  "পুনর্মিলনী",
  "বার্ষিক ইফতার মাহফিল",
  "ট্যুর ও ভ্রমণ",
  "খেলাধুলা ও উৎসব",
  "দোয়া ও বিশেষ অনুষ্ঠান",
  "স্মৃতিচারণ",
];

export function GalleryManagerClient({
  galleryItems,
}: {
  galleryItems: GalleryItemData[];
}) {
  const [items, setItems] = useState<GalleryItemData[]>(galleryItems);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Form State
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createCategory, setCreateCategory] = useState("ক্যাম্পাস জীবন");
  const [createCustomCategory, setCreateCustomCategory] = useState("");
  const [createEventDate, setCreateEventDate] = useState("");
  const [createCaption, setCreateCaption] = useState("");

  // Edit Form State
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editCaption, setEditCaption] = useState("");

  const handleOpenCreate = () => {
    setCreateImageUrl("");
    setCreateTitle("");
    setCreateCategory("ক্যাম্পাস জীবন");
    setCreateCustomCategory("");
    setCreateEventDate("");
    setCreateCaption("");
    setFeedback(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: GalleryItemData) => {
    setEditingItem(item);
    setEditImageUrl(item.imageUrl);
    setEditTitle(item.title);
    setEditCategory(item.category || "ক্যাম্পাস জীবন");
    setEditEventDate(item.eventDate || "");
    setEditCaption(item.caption || "");
    setFeedback(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createImageUrl) {
      setFeedback({ type: "error", message: "অনুগ্রহ করে একটি ছবি আপলোড করুন।" });
      return;
    }
    if (!createTitle.trim()) {
      setFeedback({ type: "error", message: "ছবির শিরোনাম বা ইভেন্টের নাম আবশ্যক।" });
      return;
    }

    const finalCategory =
      createCategory === "CUSTOM"
        ? createCustomCategory.trim() || "স্মৃতিচারণ"
        : createCategory;

    const formData = new FormData();
    formData.append("title", createTitle.trim());
    formData.append("imageUrl", createImageUrl);
    formData.append("category", finalCategory);
    formData.append("eventDate", createEventDate.trim());
    formData.append("caption", createCaption.trim());

    setFeedback(null);
    startTransition(async () => {
      const res = await createGalleryItemAction(formData);
      if (res.success && res.item) {
        setItems((prev) => [res.item as unknown as GalleryItemData, ...prev]);
        setFeedback({
          type: "success",
          message: "নতুন ছবি সফলভাবে অ্যালবামে যুক্ত হয়েছে!",
        });
        setIsCreateOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "ছবি যুক্ত করতে ব্যর্থ হয়েছে।",
        });
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editImageUrl) {
      setFeedback({ type: "error", message: "ছবি খালি রাখা যাবে না।" });
      return;
    }
    if (!editTitle.trim()) {
      setFeedback({ type: "error", message: "ছবির শিরোনাম আবশ্যক।" });
      return;
    }

    const formData = new FormData();
    formData.append("title", editTitle.trim());
    formData.append("imageUrl", editImageUrl);
    formData.append("category", editCategory.trim());
    formData.append("eventDate", editEventDate.trim());
    formData.append("caption", editCaption.trim());

    setFeedback(null);
    startTransition(async () => {
      const res = await updateGalleryItemAction(editingItem.id, formData);
      if (res.success && res.item) {
        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? (res.item as unknown as GalleryItemData) : it))
        );
        setFeedback({
          type: "success",
          message: "ছবির তথ্য সফলভাবে আপডেট হয়েছে!",
        });
        setEditingItem(null);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "আপডেট ব্যর্থ হয়েছে।",
        });
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${title}" ছবিটি মুছে ফেলতে চান?`)) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteGalleryItemAction(id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setFeedback({
          type: "success",
          message: "ছবিটি মুছে ফেলা হয়েছে।",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "মুছে ফেলতে ব্যর্থ হয়েছে।",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <FolderHeart className="w-4 h-4" />
            <span>স্মৃতি ও ছবির অ্যালবাম</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            ফটো গ্যালারি ও অ্যালবাম ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            খুলনা আলিয়া ২০১২ ব্যাচের বন্ধুদের ক্যাম্পাস স্মৃতি, পুনর্মিলনী ও অনুষ্ঠানসমূহের ছবি আপলোড ও পরিচালনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/gallery"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-emerald-800 hover:bg-slate-50 text-xs sm:text-sm font-bold transition shadow-2xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>পাবলিক গ্যালারি দেখুন</span>
          </Link>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ছবি আপলোড</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Gallery Cards Grid */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              এখনো কোনো ছবি যুক্ত করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              আমাদের ক্যাম্পাসের সোনালী দিন বা বন্ধুদের বিভিন্ন স্মৃতিচিহ্ন এখানে ছবি আপলোড করে সংগ্রহশালায় যোগ করুন।
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>প্রথম ছবিটি আপলোড করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col group"
            >
              {/* Photo Box */}
              <div className="h-48 bg-slate-100 overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {item.category && (
                  <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                    {item.category}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  {item.eventDate && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <Calendar className="w-3 h-3" />
                      <span>{item.eventDate}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-emerald-800 transition">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ডিলিট</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PHOTO MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    নতুন ছবি বা অ্যালবাম যোগ করুন
                  </h2>
                  <p className="text-xs text-slate-500">
                    ক্যাম্পাসের স্মৃতি বা অনুষ্ঠানের ছবি আপলোড করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Image Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ছবি আপলোড করুন <span className="text-red-500">*</span>
                </label>
                <FileUploader
                  folder="gallery"
                  label="গ্যালারির ছবি নির্বাচন বা ড্র্যাগ করুন (JPG, PNG, WebP)"
                  onUploadComplete={(url) => setCreateImageUrl(url)}
                />
                {createImageUrl && (
                  <div className="mt-2 relative rounded-2xl overflow-hidden border border-emerald-200 h-40 bg-slate-100">
                    <img
                      src={createImageUrl}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      আপলোড সম্পন্ন ✓
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছবির শিরোনাম / ইভেন্টের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="যেমন: ২০১২ আলিয়া বিদায় সংবর্ধনা অথবা বার্ষিক ইফতার মাহফিল"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">অন্যান্য (নিজে লিখুন)</option>
                  </select>

                  {createCategory === "CUSTOM" && (
                    <input
                      type="text"
                      value={createCustomCategory}
                      onChange={(e) => setCreateCustomCategory(e.target.value)}
                      placeholder="ক্যাটাগরির নাম লিখুন..."
                      className="w-full mt-2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    তারিখ বা সন (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={createEventDate}
                    onChange={(e) => setCreateEventDate(e.target.value)}
                    placeholder="যেমন: ২০১২ অথবা ১৫ মার্চ ২০২৪"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  স্মৃতিকথা বা ক্যাপশন (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={createCaption}
                  onChange={(e) => setCreateCaption(e.target.value)}
                  placeholder="এই মুহূর্তটির পেছনের কোনো মধুর স্মৃতি বা বন্ধুদের কথা লিখুন..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending || !createImageUrl || !createTitle.trim()}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>গ্যালারিতে প্রকাশ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PHOTO MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    ছবির তথ্য পরিবর্তন ও সম্পাদনা
                  </h2>
                  <p className="text-xs text-slate-500">
                    শিরোনাম, ক্যাপশন বা ছবি পরিবর্তন করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Current photo preview & replace */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ছবি পরিবর্তন করতে চাইলে নতুন ছবি আপলোড করুন
                </label>
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-100 mb-2">
                  <img
                    src={editImageUrl}
                    alt="Current"
                    className="w-full h-full object-cover"
                  />
                </div>
                <FileUploader
                  folder="gallery"
                  label="নতুন ছবি দিয়ে প্রতিস্থাপন করতে চান? এখানে আপলোড করুন"
                  onUploadComplete={(url) => setEditImageUrl(url)}
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছবির শিরোনাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="ক্যাটাগরির নাম"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    তারিখ বা সন
                  </label>
                  <input
                    type="text"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  স্মৃতিকথা বা ক্যাপশন
                </label>
                <textarea
                  rows={2}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending || !editImageUrl || !editTitle.trim()}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পরিবর্তন সংরক্ষণ করুন</span>
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
