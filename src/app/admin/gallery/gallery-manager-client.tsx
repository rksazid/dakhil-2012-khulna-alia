"use client";

import { useState, useTransition, useRef } from "react";
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
  Star,
  Upload,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Images,
} from "lucide-react";
import {
  createGalleryItemAction,
  updateGalleryItemAction,
  deleteGalleryItemAction,
} from "@/actions/gallery-actions";
import { toBengaliNumber } from "@/lib/utils";

export interface GalleryItemData {
  id: string;
  title: string;
  imageUrl: string;
  images?: string[];
  caption?: string | null;
  eventDate?: string | null;
  category?: string | null;
  googlePhotosUrl?: string | null;
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

// Browser canvas compression for quick multi-file upload
async function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }
  if (file.size < 400 * 1024) {
    return file;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function GalleryManagerClient({
  galleryItems,
}: {
  galleryItems: GalleryItemData[];
}) {
  const [items, setItems] = useState<GalleryItemData[]>(galleryItems);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItemData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Form State
  const [createTitle, setCreateTitle] = useState("");
  const [createCategory, setCreateCategory] = useState("ক্যাম্পাস জীবন");
  const [createCustomCategory, setCreateCustomCategory] = useState("");
  const [createEventDate, setCreateEventDate] = useState("");
  const [createCaption, setCreateCaption] = useState("");
  const [createGooglePhotosUrl, setCreateGooglePhotosUrl] = useState("");
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [createCoverUrl, setCreateCoverUrl] = useState("");
  const [createUrlInput, setCreateUrlInput] = useState("");

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editCategorySelect, setEditCategorySelect] = useState("ক্যাম্পাস জীবন");
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editGooglePhotosUrl, setEditGooglePhotosUrl] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editUrlInput, setEditUrlInput] = useState("");

  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateTitle("");
    setCreateCategory("ক্যাম্পাস জীবন");
    setCreateCustomCategory("");
    setCreateEventDate("");
    setCreateCaption("");
    setCreateGooglePhotosUrl("");
    setCreateImages([]);
    setCreateCoverUrl("");
    setCreateUrlInput("");
    setFeedback(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal with prefilled data and dropdown
  const handleOpenEdit = (item: GalleryItemData) => {
    setEditingItem(item);
    setEditTitle(item.title);

    // Set Category Dropdown or Custom
    const cat = item.category || "ক্যাম্পাস জীবন";
    if (CATEGORY_PRESETS.includes(cat)) {
      setEditCategorySelect(cat);
      setEditCustomCategory("");
    } else {
      setEditCategorySelect("CUSTOM");
      setEditCustomCategory(cat);
    }

    setEditEventDate(item.eventDate || "");
    setEditCaption(item.caption || "");
    setEditGooglePhotosUrl(item.googlePhotosUrl || "");

    // Prepare images array
    const imgs = item.images && item.images.length > 0 ? [...item.images] : [item.imageUrl];
    setEditImages(imgs);
    setEditCoverUrl(item.imageUrl || imgs[0] || "");
    setEditUrlInput("");
    setFeedback(null);
  };

  // Handle uploading multiple files for Create
  const handleUploadFiles = async (
    files: FileList | null,
    isEdit = false
  ) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setUploadProgress({ current: 0, total: fileList.length });
    const uploadedUrls: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("folder", "gallery");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        }
      } catch (err) {
        console.error("Batch upload failed for file:", file.name, err);
      }
      setUploadProgress({ current: i + 1, total: fileList.length });
    }

    setUploadProgress(null);

    if (uploadedUrls.length > 0) {
      if (isEdit) {
        setEditImages((prev) => {
          const next = [...prev, ...uploadedUrls];
          if (!editCoverUrl && next.length > 0) {
            setEditCoverUrl(next[0]);
          }
          return next;
        });
      } else {
        setCreateImages((prev) => {
          const next = [...prev, ...uploadedUrls];
          if (!createCoverUrl && next.length > 0) {
            setCreateCoverUrl(next[0]);
          }
          return next;
        });
      }
    }
  };

  // Add image by direct URL
  const handleAddImageUrl = (isEdit = false) => {
    const url = isEdit ? editUrlInput.trim() : createUrlInput.trim();
    if (!url) return;

    if (isEdit) {
      setEditImages((prev) => {
        const next = [...prev, url];
        if (!editCoverUrl) setEditCoverUrl(url);
        return next;
      });
      setEditUrlInput("");
    } else {
      setCreateImages((prev) => {
        const next = [...prev, url];
        if (!createCoverUrl) setCreateCoverUrl(url);
        return next;
      });
      setCreateUrlInput("");
    }
  };

  // Create Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createTitle.trim()) {
      setFeedback({ type: "error", message: "ছবির শিরোনাম বা ইভেন্টের নাম আবশ্যক।" });
      return;
    }

    if (createImages.length === 0 && !createGooglePhotosUrl.trim()) {
      setFeedback({
        type: "error",
        message: "অনুগ্রহ করে অন্তত একটি ছবি আপলোড করুন অথবা গুগল ফটোজের অ্যালবাম লিংক দিন।",
      });
      return;
    }

    const finalCategory =
      createCategory === "CUSTOM"
        ? createCustomCategory.trim() || "স্মৃতিচারণ"
        : createCategory;

    const coverUrl = createCoverUrl || createImages[0] || "";

    const formData = new FormData();
    formData.append("title", createTitle.trim());
    formData.append("imageUrl", coverUrl);
    formData.append("images", JSON.stringify(createImages));
    formData.append("category", finalCategory);
    formData.append("eventDate", createEventDate.trim());
    formData.append("caption", createCaption.trim());
    formData.append("googlePhotosUrl", createGooglePhotosUrl.trim());

    setFeedback(null);
    startTransition(async () => {
      const res = await createGalleryItemAction(formData);
      if (res.success && res.item) {
        setItems((prev) => [res.item as unknown as GalleryItemData, ...prev]);
        setFeedback({
          type: "success",
          message: "নতুন অ্যালবাম ও ছবি সফলভাবে গ্যালারিতে যোগ হয়েছে!",
        });
        setIsCreateOpen(false);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "সংরক্ষণ করতে ব্যর্থ হয়েছে।",
        });
      }
    });
  };

  // Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim()) {
      setFeedback({ type: "error", message: "ছবির শিরোনাম আবশ্যক।" });
      return;
    }

    if (editImages.length === 0 && !editGooglePhotosUrl.trim()) {
      setFeedback({
        type: "error",
        message: "অনুগ্রহ করে অন্তত একটি ছবি রাখুন অথবা গুগল ফটোজের অ্যালবাম লিংক দিন।",
      });
      return;
    }

    const finalCategory =
      editCategorySelect === "CUSTOM"
        ? editCustomCategory.trim() || "স্মৃতিচারণ"
        : editCategorySelect;

    const coverUrl = editCoverUrl || editImages[0] || "";

    const formData = new FormData();
    formData.append("title", editTitle.trim());
    formData.append("imageUrl", coverUrl);
    formData.append("images", JSON.stringify(editImages));
    formData.append("category", finalCategory);
    formData.append("eventDate", editEventDate.trim());
    formData.append("caption", editCaption.trim());
    formData.append("googlePhotosUrl", editGooglePhotosUrl.trim());

    setFeedback(null);
    startTransition(async () => {
      const res = await updateGalleryItemAction(editingItem.id, formData);
      if (res.success && res.item) {
        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? (res.item as unknown as GalleryItemData) : it))
        );
        setFeedback({
          type: "success",
          message: "অ্যালবামের তথ্য সফলভাবে আপডেট হয়েছে!",
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

  // Delete
  const handleDelete = (id: string, title: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${title}" অ্যালবামটি মুছে ফেলতে চান?`)) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteGalleryItemAction(id);
      if (res.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        setFeedback({
          type: "success",
          message: "অ্যালবামটি মুছে ফেলা হয়েছে।",
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
            একটি ইভেন্টে একাধিক ছবি একসাথে আপলোড করুন, গুগল ফটোজ অ্যালবাম লিংক শেয়ার করুন এবং স্মৃতিচারণ করুন।
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
            <span>নতুন অ্যালবাম/ছবি আপলোড</span>
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
              এখনো কোনো অ্যালবাম বা ছবি যুক্ত করা হয়নি
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              আমাদের ক্যাম্পাসের সোনালী দিন বা বন্ধুদের বিভিন্ন স্মৃতিচিহ্ন এখানে ছবি বা গুগল ফটোজ লিংক দিয়ে সংরক্ষণ করুন।
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>প্রথম অ্যালবামটি তৈরি করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item) => {
            const photoCount =
              item.images && item.images.length > 0
                ? item.images.length
                : item.imageUrl
                ? 1
                : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col group"
              >
                {/* Photo Box */}
                <div className="h-48 bg-slate-100 overflow-hidden relative">
                  <img
                    src={item.imageUrl || (item.images && item.images[0]) || "/logo.png"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {item.category && (
                    <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      {item.category}
                    </span>
                  )}
                  {photoCount > 1 && (
                    <span className="absolute bottom-3 right-3 bg-emerald-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      <span>{toBengaliNumber(photoCount)}টি ছবি</span>
                    </span>
                  )}
                  {item.googlePhotosUrl && (
                    <span className="absolute top-3 right-3 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>গুগল ফটোজ</span>
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
            );
          })}
        </div>
      )}

      {/* CREATE MODAL (Multiple images + Google Photos Link) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Images className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    নতুন অ্যালবাম বা একাধিক ছবি আপলোড
                  </h2>
                  <p className="text-xs text-slate-500">
                    একই ইভেন্টের একাধিক ছবি একসাথে আপলোড বা গুগল ফটোজ লিংক যুক্ত করুন
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
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অ্যালবাম / ইভেন্টের নাম <span className="text-red-500">*</span>
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

              {/* Multi-Image File Selection Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ইভেন্টের ছবিসমূহ আপলোড করুন (একাধিক ছবি একসাথে নির্বাচন করা যাবে)
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={createFileInputRef}
                  onChange={(e) => handleUploadFiles(e.target.files, false)}
                  className="hidden"
                />

                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-5 text-center space-y-2 hover:bg-emerald-50/70 transition">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => createFileInputRef.current?.click()}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>ছবি নির্বাচন করুন (একাধিক সম্ভব)</span>
                    </button>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      JPG, PNG, WebP ফরম্যাটের যেকোনো সংখ্যক ছবি নির্বাচন করতে পারেন।
                    </p>
                  </div>
                </div>

                {uploadProgress && (
                  <div className="mt-2 p-2.5 bg-emerald-100/70 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>
                      ছবি আপলোড হচ্ছে... ({toBengaliNumber(uploadProgress.current)}/
                      {toBengaliNumber(uploadProgress.total)} সম্পন্ন)
                    </span>
                  </div>
                )}

                {/* Uploaded Photos Grid */}
                {createImages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                      <span>যুক্ত হওয়া ছবি ({toBengaliNumber(createImages.length)}টি):</span>
                      <span className="text-[11px] text-emerald-700">
                        স্টার (★) চিহ্নিত ছবিটি কভার হিসেবে প্রদর্শিত হবে
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                      {createImages.map((imgUrl, idx) => {
                        const isCover = (createCoverUrl || createImages[0]) === imgUrl;
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-xl overflow-hidden border-2 h-20 group ${
                              isCover ? "border-amber-500 ring-2 ring-amber-300" : "border-slate-200"
                            }`}
                          >
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />

                            {/* Set as Cover Button */}
                            <button
                              type="button"
                              onClick={() => setCreateCoverUrl(imgUrl)}
                              className={`absolute top-1 left-1 p-1 rounded-md transition ${
                                isCover
                                  ? "bg-amber-500 text-white"
                                  : "bg-black/60 text-white hover:bg-amber-500"
                              }`}
                              title={isCover ? "মূল কভার ছবি" : "কভার হিসেবে নির্বাচন করুন"}
                            >
                              <Star className={`w-3 h-3 ${isCover ? "fill-white" : ""}`} />
                            </button>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => {
                                setCreateImages((prev) => prev.filter((_, i) => i !== idx));
                                if (createCoverUrl === imgUrl) {
                                  setCreateCoverUrl(createImages[idx === 0 ? 1 : 0] || "");
                                }
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition"
                              title="ছবিটি বাদ দিন"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Image URL input */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  অথবা সরাসরি কোনো ছবির ওয়েব লিংক যুক্ত করুন (ঐচ্ছিক)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={createUrlInput}
                    onChange={(e) => setCreateUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddImageUrl(false)}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 rounded-xl transition"
                  >
                    লিংক যোগ করুন
                  </button>
                </div>
              </div>

              {/* Google Photos Shareable Album Link */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80 space-y-1.5">
                <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                  <span>গুগল ফটোজ শেয়ারেবল লিংক (Google Photos Shareable Link)</span>
                </label>
                <input
                  type="url"
                  value={createGooglePhotosUrl}
                  onChange={(e) => setCreateGooglePhotosUrl(e.target.value)}
                  placeholder="যেমন: https://photos.app.goo.gl/xxxx অথবা ড্রাইভ ফোল্ডার লিংক"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-blue-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-blue-800/80">
                  💡 গুগল ফটোজে রাখা পুরো অ্যালবামের শেয়ার লিংক দিলে সহপাঠীরা সরাসরি আসল হাই-রেজুলেশন ছবিগুলো দেখতে পারবে।
                </p>
              </div>

              {/* Category & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি (ড্রপডাউন)
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
                  disabled={isPending || (!createImages.length && !createGooglePhotosUrl) || !createTitle.trim()}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>অ্যালবাম প্রকাশ করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL with Category Dropdown and Multi-Image Manager */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    অ্যালবাম সম্পাদনা ও ছবি পরিবর্তন
                  </h2>
                  <p className="text-xs text-slate-500">
                    শিরোনাম, ক্যাটাগরি ড্রপডাউন, গুগল ফটোজ লিংক বা নতুন ছবি যোগ করুন
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
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছবির শিরোনাম / অ্যালবামের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Manage Existing and Add New Images */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  অ্যালবামের ছবিসমূহ ({toBengaliNumber(editImages.length)}টি)
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={(e) => handleUploadFiles(e.target.files, true)}
                  className="hidden"
                />

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>আরও ছবি আপলোড করুন</span>
                  </button>
                </div>

                {uploadProgress && (
                  <div className="mb-2 p-2.5 bg-emerald-100/70 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>
                      ছবি আপলোড হচ্ছে... ({toBengaliNumber(uploadProgress.current)}/
                      {toBengaliNumber(uploadProgress.total)} সম্পন্ন)
                    </span>
                  </div>
                )}

                {editImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                    {editImages.map((imgUrl, idx) => {
                      const isCover = (editCoverUrl || editImages[0]) === imgUrl;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border-2 h-20 group ${
                            isCover ? "border-amber-500 ring-2 ring-amber-300" : "border-slate-200"
                          }`}
                        >
                          <img src={imgUrl} alt="" className="w-full h-full object-cover" />

                          {/* Set Cover */}
                          <button
                            type="button"
                            onClick={() => setEditCoverUrl(imgUrl)}
                            className={`absolute top-1 left-1 p-1 rounded-md transition ${
                              isCover
                                ? "bg-amber-500 text-white"
                                : "bg-black/60 text-white hover:bg-amber-500"
                            }`}
                            title={isCover ? "মূল কভার ছবি" : "কভার হিসেবে নির্বাচন করুন"}
                          >
                            <Star className={`w-3 h-3 ${isCover ? "fill-white" : ""}`} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditImages((prev) => prev.filter((_, i) => i !== idx));
                              if (editCoverUrl === imgUrl) {
                                setEditCoverUrl(editImages[idx === 0 ? 1 : 0] || "");
                              }
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct image link */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  অথবা সরাসরি কোনো ছবির ওয়েব লিংক যোগ করুন (ঐচ্ছিক)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editUrlInput}
                    onChange={(e) => setEditUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddImageUrl(true)}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 rounded-xl transition"
                  >
                    লিংক যোগ করুন
                  </button>
                </div>
              </div>

              {/* Google Photos Shareable Album Link */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80 space-y-1.5">
                <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                  <span>গুগল ফটোজ শেয়ারেবল লিংক (Google Photos Shareable Link)</span>
                </label>
                <input
                  type="url"
                  value={editGooglePhotosUrl}
                  onChange={(e) => setEditGooglePhotosUrl(e.target.value)}
                  placeholder="https://photos.app.goo.gl/xxxx অথবা গুগল ড্রাইভ লিংক"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-blue-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Dropdown (Requested Fix) & Event Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ক্যাটাগরি (ড্রপডাউন)
                  </label>
                  <select
                    value={editCategorySelect}
                    onChange={(e) => setEditCategorySelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="CUSTOM">অন্যান্য (নিজে লিখুন)</option>
                  </select>

                  {editCategorySelect === "CUSTOM" && (
                    <input
                      type="text"
                      value={editCustomCategory}
                      onChange={(e) => setEditCustomCategory(e.target.value)}
                      placeholder="ক্যাটাগরির নাম লিখুন..."
                      className="w-full mt-2 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  )}
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
                  disabled={isPending || (!editImages.length && !editGooglePhotosUrl) || !editTitle.trim()}
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
