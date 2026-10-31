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
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "আপলোড ব্যর্থ হয়েছে।");
      }

      setPreviewUrl(data.url);
      onUploadComplete(data.url);
    } catch (err: unknown) {
      console.error(err);
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
        <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          {error}
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
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              Vercel অবজেক্ট স্টোরেজে আপলোড হচ্ছে...
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-600 mb-1">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                ক্লিক করে ফাইল নির্বাচন করুন
              </p>
              <p className="text-[10px] text-slate-400">
                (JPG, PNG, WebP বা PDF — সর্বোচ্চ ১০MB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
