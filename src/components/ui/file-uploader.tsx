"use client";

import { useState, useRef } from "react";
import { Upload, X, Check, Image as ImageIcon, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  folder?: "receipts" | "avatars" | "banners" | "gallery" | "uploads";
  label?: string;
  initialUrl?: string | null;
  accept?: string;
}

/**
 * Compresses an image in the browser using HTML5 Canvas before uploading.
 * Reduces 5MB-20MB mobile camera photos down to ~150KB-350KB in milliseconds,
 * preventing Vercel 4.5MB Serverless Function limits (HTTP 413) and speeding up upload 50x.
 */
async function compressImageIfNeeded(file: File, maxDimension = 1200, quality = 0.82): Promise<File> {
  // If not an image or is SVG/GIF, return unchanged
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  // If already small (< 500 KB), return as is
  if (file.size < 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
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

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function FileUploader({
  onUploadComplete,
  folder = "uploads",
  label = "ছবি বা রসিদ আপলোড করুন",
  initialUrl = null,
  accept = "image/*,application/pdf",
}: FileUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setError(null);
    setIsUploading(true);

    try {
      // 1. Client-side image compression
      const fileToUpload = await compressImageIfNeeded(originalFile);

      // Check max size (4.5 MB serverless limit)
      if (fileToUpload.size > 4.5 * 1024 * 1024) {
        throw new Error("ফাইলের সাইজ অনেক বড় (সর্বোচ্চ ৪.৫ মেগাবাইট)। অনুগ্রহ করে ছোট সাইজের ছবি দিন।");
      }

      // 2. Build form data
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("folder", folder);

      // 3. Send upload request
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // 4. Safe text-first response reading (handles non-JSON HTML/text errors such as HTTP 413)
      const text = await res.text();
      let data: { success?: boolean; error?: string; url?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        if (res.status === 413 || text.includes("Request Entity Too Large")) {
          throw new Error("ফাইলের সাইজ অনেক বড় (সর্বোচ্চ ৪.৫MB)। ছোট সাইজের ছবি নির্বাচন করুন।");
        }
        if (res.status === 401) {
          throw new Error("অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।");
        }
        throw new Error(`সার্ভার ত্রুটি (${res.status}): অনুগ্রহ করে পুনরায় চেষ্টা করুন।`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "আপলোড ব্যর্থ হয়েছে।");
      }

      if (data.url) {
        setPreviewUrl(data.url);
        onUploadComplete(data.url);
      }
    } catch (err: unknown) {
      console.error("Upload handler error:", err);
      setError(err instanceof Error ? err.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      {error && (
        <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
          ⚠️ {error}
        </p>
      )}

      {previewUrl ? (
        <div className="relative rounded-xl border border-emerald-300 bg-emerald-50/50 p-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 overflow-hidden shrink-0 border border-emerald-200 flex items-center justify-center">
              {previewUrl.startsWith("data:image") || previewUrl.startsWith("http") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-emerald-700" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Vercel অবজেক্ট স্টোরেজে আপলোড সম্পন্ন
              </span>
              <p className="text-[11px] font-mono text-emerald-700 truncate max-w-xs">
                {previewUrl}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="মুছে নতুন ছবি দিন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ছবি প্রসেস ও Vercel অবজেক্ট স্টোরেজে আপলোড হচ্ছে...
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 mb-1">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                ক্লিক করে ছবি বা ফাইল নির্বাচন করুন
              </p>
              <p className="text-[10px] text-slate-400">
                (JPG, PNG, WebP — স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে আপলোড হবে)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
