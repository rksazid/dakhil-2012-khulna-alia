"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Plus,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  Tag,
} from "lucide-react";

export interface GalleryItemView {
  id: string;
  title: string;
  imageUrl: string;
  caption?: string | null;
  eventDate?: string | null;
  category?: string | null;
  createdAt: Date | string;
}

interface GalleryClientProps {
  initialItems: GalleryItemView[];
  canManage: boolean;
}

export function GalleryClient({ initialItems, canManage }: GalleryClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Extract unique categories
  const categories = Array.from(
    new Set(initialItems.map((item) => item.category).filter(Boolean))
  ) as string[];

  const filteredItems =
    selectedCategory === "ALL"
      ? initialItems
      : initialItems.filter((item) => item.category === selectedCategory);

  const activePhoto =
    activePhotoIndex !== null ? filteredItems[activePhotoIndex] : null;

  const handleNext = () => {
    if (activePhotoIndex !== null) {
      setActivePhotoIndex((activePhotoIndex + 1) % filteredItems.length);
    }
  };

  const handlePrev = () => {
    if (activePhotoIndex !== null) {
      setActivePhotoIndex(
        (activePhotoIndex - 1 + filteredItems.length) % filteredItems.length
      );
    }
  };

  const handleCopyLink = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            সব ছবি ({initialItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === cat
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Admin Upload Shortcut */}
        {canManage && (
          <Link
            href="/admin/gallery"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ছবি আপলোড করুন</span>
          </Link>
        )}
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              {selectedCategory === "ALL"
                ? "বর্তমানে কোনো ছবি যুক্ত করা হয়নি"
                : `"${selectedCategory}" ক্যাটাগরিতে কোনো ছবি নেই`}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              আমাদের ক্যাম্পাসের সোনালী স্মৃতি ও বন্ধুদের আনন্দের মুহূর্তগুলো শিগগিরই এখানে যুক্ত করা হবে।
            </p>
          </div>
          {canManage && (
            <Link
              href="/admin/gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>ছবি আপলোড করতে অ্যাডমিন প্যানেলে যান</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setActivePhotoIndex(index)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer"
            >
              {/* Photo Box */}
              <div className="h-60 bg-slate-100 overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 [image-rendering:-webkit-optimize-contrast]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                  <span className="text-white text-xs font-bold inline-flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                    <Maximize2 className="w-3.5 h-3.5" /> বড় করে দেখুন
                  </span>
                </div>
                {item.category && (
                  <span className="absolute top-3 left-3 bg-slate-950/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-white/10">
                    {item.category}
                  </span>
                )}
              </div>

              {/* Card Meta */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  {item.eventDate && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mb-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{item.eventDate}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-800 transition line-clamp-2">
                    {item.title}
                  </h3>
                </div>

                {item.caption && (
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-2 border-t border-slate-100">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX / FULL-SIZE PHOTO VIEWER MODAL */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in"
          onClick={() => setActivePhotoIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-white py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 pr-4">
              <h4 className="text-base sm:text-lg font-bold truncate">
                {activePhoto.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {activePhoto.category && (
                  <span className="text-emerald-400 font-medium">
                    {activePhoto.category}
                  </span>
                )}
                {activePhoto.eventDate && (
                  <>
                    <span>•</span>
                    <span>{activePhoto.eventDate}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyLink(activePhoto.imageUrl)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1.5"
                title="ছবির লিংক কপি করুন"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-400">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">শেয়ার</span>
                  </>
                )}
              </button>

              <a
                href={activePhoto.imageUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1.5"
                title="ছবি ডাউনলোড করুন"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">ডাউনলোড</span>
              </a>

              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Image View with Nav arrows */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.imageUrl}
              alt={activePhoto.title}
              className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl [image-rendering:-webkit-optimize-contrast]"
            />

            {filteredItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-xl transition hover:scale-105"
                  title="পূর্ববর্তী ছবি"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 shadow-xl transition hover:scale-105"
                  title="পরবর্তী ছবি"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Caption Bar */}
          {activePhoto.caption && (
            <div
              className="w-full max-w-3xl bg-black/60 backdrop-blur-md rounded-2xl p-4 text-center text-xs sm:text-sm text-slate-200 border border-white/10 shadow-lg mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {activePhoto.caption}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
